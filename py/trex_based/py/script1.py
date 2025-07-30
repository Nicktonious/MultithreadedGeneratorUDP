from trex.stl.api import *
import random

# 1. Генерация тестовых данных
payloads = [f"Payload-{i}".encode() for i in range(1, N+1)]
destinations = ["10.0.0.{}".format(i) for i in range(1, N+1)]

# 2. Кастомный builder для уникальных payload
class CustomBuilder(STLPktBuilder):
    def __init__(self, payloads):
        self.payloads = payloads
        self.index = 0
        super().__init__()

    def build_packet(self):
        if self.index >= len(self.payloads):
            self.index = 0  # Зацикливаем
        payload = self.payloads[self.index]
        self.index += 1
        return Ether() / IP(dst=destinations[self.index-1]) / UDP() / payload

# 3. VM для перебора адресов (если нужно менять и src_ip)
vm = STLVM()
vm.var(name="dst_ip", min_value=1, max_value=N, size=4, op="inc")
vm.write(fv_name="dst_ip", pkt_offset="IP.dst")

# 4. Создаем поток
stream = STLStream(
    packet=CustomBuilder(payloads),
    mode=STLTXSingleBurst(total_pkts=N),  # Отправляем ровно N пакетов
    vm=vm  # Если нужно менять dst_ip через VM
)

# 5. Запуск
client = STLClient()
client.connect()
client.add_streams([stream], ports=[0])
client.start(ports=[0])
client.wait_on_traffic()