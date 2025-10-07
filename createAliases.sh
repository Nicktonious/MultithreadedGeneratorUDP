#!/bin/bash

# Настройки
INTERFACE="enp1s0np1"    # Основной интерфейс
NETWORK="10.120.101."    # Префикс сети
START=13                 # Начальный IP
END=200                   # Конечный IP
SUBNET="/24"             # Маска подсети

# Создание алиасов (псевдо-интерфейсов)
create_interface_aliases() {
    for ((i=START; i<=END; i++)); do
        IP="${NETWORK}${i}${SUBNET}"
        ALIAS_INTERFACE="${INTERFACE}:${i}"

        # Создаем алиас интерфейса и добавляем IP
        sudo ip addr add ${IP} dev ${INTERFACE} label ${ALIAS_INTERFACE}

        # Проверяем успешность
        if [ $? -eq 0 ]; then
            echo "Создан алиас: ${ALIAS_INTERFACE} с IP: ${IP}"
        else
            echo "Ошибка при создании алиаса: ${ALIAS_INTERFACE}"
        fi
    done
}

# Показать созданные алиасы
show_aliases() {
    echo ""
    echo "Текущие алиасы интерфейса ${INTERFACE}:"
    ip addr show ${INTERFACE} | grep "inet" | grep "${INTERFACE}:"
}

# Удалить все алиасы
remove_aliases() {
    for ((i=START; i<=END; i++)); do
        ALIAS_INTERFACE="${INTERFACE}:${i}"
        IP="${NETWORK}${i}${SUBNET}"

        sudo ip addr del ${IP} dev ${INTERFACE}
        echo "Удален алиас: ${ALIAS_INTERFACE}"
    done
}

# Основная логика
case "${1}" in
    create)
        create_interface_aliases
        show_aliases
        ;;
    remove)
        remove_aliases
        ;;
    show)
        show_aliases
        ;;
    *)
        echo "Использование: $0 [create|remove|show]"
        echo "  create - создать алиасы интерфейсов"
        echo "  remove - удалить все алиасы"
        echo "  show   - показать текущие алиасы"
        ;;
esac