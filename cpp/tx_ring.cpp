#include "tx_ring.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>
#include <sys/mman.h>
#include <sys/ioctl.h>
#include <net/if.h>
#include <net/ethernet.h>
#include <netinet/in.h>

// Внутренняя функция для получения индекса интерфейса по его имени
static int get_if_index(int fd, const char *if_name) {
    struct ifreq ifr;
    memset(&ifr, 0, sizeof(ifr));
    strncpy(ifr.ifr_name, if_name, IFNAMSIZ - 1);
    if (ioctl(fd, SIOCGIFINDEX, &ifr) == -1) {
        perror("ioctl(SIOCGIFINDEX) failed");
        return -1;
    }
    return ifr.ifr_ifindex;
}

tx_ring_t* tx_ring_init(const char *if_name, unsigned int frame_size, unsigned int frame_nr) {
    // 1. Выделяем память под нашу управляющую структуру
    tx_ring_t *ring = calloc(1, sizeof(tx_ring_t));
    if (!ring) {
        perror("calloc for tx_ring_t failed");
        return NULL;
    }

    // 2. Создаем RAW сокет AF_PACKET
    ring->fd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));
    if (ring->fd < 0) {
        perror("socket(AF_PACKET, SOCK_RAW) failed");
        free(ring);
        return NULL;
    }

    // 3. Заполняем структуру tpacket_req для настройки кольцевого буфера
    ring->req.tp_frame_size = frame_size;
    ring->req.tp_block_size = getpagesize(); // Обычно размер блока равен размеру страницы
    // Убеждаемся, что размер блока кратен размеру фрейма
    while (ring->req.tp_block_size < ring->req.tp_frame_size || ring->req.tp_block_size % ring->req.tp_frame_size) {
        ring->req.tp_block_size *= 2;
    }
    ring->req.tp_frame_nr = frame_nr;
    ring->req.tp_block_nr = ring->req.tp_frame_nr / (ring->req.tp_block_size / ring->req.tp_frame_size);

    // 4. Устанавливаем опцию PACKET_TX_RING, передавая ядру наши параметры
    if (setsockopt(ring->fd, SOL_PACKET, PACKET_TX_RING, &ring->req, sizeof(ring->req)) < 0) {
        perror("setsockopt(PACKET_TX_RING) failed");
        close(ring->fd);
        free(ring);
        return NULL;
    }

    // 5. Отображаем кольцевой буфер (созданный ядром) в адресное пространство процесса
    size_t map_size = ring->req.tp_block_nr * ring->req.tp_block_size;
    ring->p_map = mmap(NULL, map_size, PROT_READ | PROT_WRITE, MAP_SHARED | MAP_LOCKED, ring->fd, 0);
    if (ring->p_map == MAP_FAILED) {
        perror("mmap failed");
        close(ring->fd);
        free(ring);
        return NULL;
    }

    // 6. Биндим сокет к конкретному сетевому интерфейсу
    struct sockaddr_ll sll;
    memset(&sll, 0, sizeof(sll));
    sll.sll_family = AF_PACKET;
    sll.sll_protocol = htons(ETH_P_ALL);
    sll.sll_ifindex = get_if_index(ring->fd, if_name);
    if (sll.sll_ifindex < 0) {
        munmap(ring->p_map, map_size);
        close(ring->fd);
        free(ring);
        return NULL;
    }

    if (bind(ring->fd, (struct sockaddr *)&sll, sizeof(sll)) < 0) {
        perror("bind failed");
        munmap(ring->p_map, map_size);
        close(ring->fd);
        free(ring);
        return NULL;
    }

    ring->current_frame = 0;
    return ring;
}

void tx_ring_destroy(tx_ring_t *ring) {
    if (!ring) return;
    if (ring->p_map) {
        munmap(ring->p_map, ring->req.tp_block_nr * ring->req.tp_block_size);
    }
    if (ring->fd >= 0) {
        close(ring->fd);
    }
    free(ring);
}

uint8_t* tx_ring_get_frame(tx_ring_t *ring) {
    // Вычисляем адрес заголовка текущего фрейма
    struct tpacket_hdr *hdr = (struct tpacket_hdr *)(ring->p_map + (ring->current_frame * ring->req.tp_frame_size));

    // Проверяем статус фрейма. Если он не TP_STATUS_AVAILABLE, значит ядро еще не отправило
    // старый пакет из этого слота. Буфер полон, нужно вызвать tx_ring_send().
    if (hdr->tp_status != TP_STATUS_AVAILABLE) {
        return NULL;
    }

    // Возвращаем указатель на область данных, которая следует сразу за заголовком
    return (uint8_t *)hdr + TPACKET_HDRLEN;
}

void tx_ring_commit_frame(tx_ring_t *ring, unsigned int len) {
    // Вычисляем адрес заголовка текущего фрейма
    struct tpacket_hdr *hdr = (struct tpacket_hdr *)(ring->p_map + (ring->current_frame * ring->req.tp_frame_size));

    // Заполняем метаданные: длину пакета и статус "готов к отправке"
    hdr->tp_len = len;
    hdr->tp_status = TP_STATUS_SEND_REQUEST;

    // Передвигаем указатель на следующий фрейм по кольцу
    ring->current_frame = (ring->current_frame + 1) % ring->req.tp_frame_nr;
}

int tx_ring_send(tx_ring_t *ring) {
    // Просто вызываем sendto без данных. Это сигнал ядру проверить TX_RING
    // и отправить все фреймы с TP_STATUS_SEND_REQUEST.
    if (sendto(ring->fd, NULL, 0, 0, NULL, 0) < 0) {
        // EAGAIN или ENOBUFS - не фатальные ошибки, означают, что очередь отправки ядра переполнена.
        // Можно просто подождать и попробовать снова.
        if (errno != EAGAIN && errno != ENOBUFS) {
            perror("sendto failed");
            return -1;
        }
    }
    return 0;
}