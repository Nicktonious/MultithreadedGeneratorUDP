#pragma once

#include <stdint.h>
#include <linux/if_packet.h>

// Основная структура, хранящая состояние кольцевого буфера
typedef struct {
    int fd;                     // Файловый дескриптор сокета AF_PACKET
    void *p_map;                // Указатель на начало отображенной в память области
    struct tpacket_req req;     // Структура с параметрами кольцевого буфера
    unsigned int current_frame; // Индекс текущего фрейма для записи
} tx_ring_t;

/**
 * @brief Инициализирует сокет AF_PACKET и настраивает TX_RING.
 * 
 * @param if_name Имя сетевого интерфейса (например, "eth0").
 * @param frame_size Размер одного фрейма. Должен быть достаточно большим для вашего самого большого пакета.
 * @param frame_nr Общее количество фреймов в буфере.
 * @return Указатель на инициализированную структуру tx_ring_t или NULL в случае ошибки.
 */
tx_ring_t* tx_ring_init(const char *if_name, unsigned int frame_size, unsigned int frame_nr);

/**
 * @brief Освобождает ресурсы, связанные с кольцевым буфером.
 * 
 * @param ring Указатель на структуру tx_ring_t.
 */
void tx_ring_destroy(tx_ring_t *ring);

/**
 * @brief Получает указатель на следующий доступный для записи фрейм.
 * 
 * @param ring Указатель на структуру tx_ring_t.
 * @return Указатель на область данных фрейма или NULL, если свободных фреймов нет.
 */
uint8_t* tx_ring_get_frame(tx_ring_t *ring);

/**
 * @brief Помечает готовый к отправке фрейм и уведомляет ядро.
 * 
 * @param ring Указатель на структуру tx_ring_t.
 * @param len Длина пакета, записанного во фрейм.
 */
void tx_ring_commit_frame(tx_ring_t *ring, unsigned int len);

/**
 * @brief Инициирует отправку всех подготовленных фреймов.
 * 
 * Эта функция вызывает системный вызов sendto(), который служит сигналом для ядра,
 * чтобы оно начало отправку всех фреймов, помеченных как TP_STATUS_SEND_REQUEST.
 * 
 * @param ring Указатель на структуру tx_ring_t.
 * @return 0 в случае успеха, -1 в случае ошибки.
 */
int tx_ring_send(tx_ring_t *ring);
