from fileReader import FileReader
import psutil
import os
import time

process = psutil.Process(os.getpid())
reader = FileReader(chunk_size=200 * 1024 * 1024)
reader.open('py/trex_based/res/r1.bin')
# Получить текущее потребление памяти в байтах:
# print_mem(process)
tt1 = time.perf_counter()
t1 = time.perf_counter()
avgT = 0
c = float(0)

while True:
    chunk = reader.next_chunk()
    if chunk is None:
        break
    t2 = time.perf_counter()
    chunk = chunk.tobytes()
    # chunk
    c += 1
    avgT = (avgT + t2-t1) / c
    t1 = t2
print(f"avg delay: {avgT:.10f} sec")
    
def print_mem(process):
    rss_bytes = process.memory_info().rss
    rss_gb = rss_bytes / (1024 ** 3)  # Делим на 1024^3
    print(f"RSS: {rss_gb:.2f} GB")
    
# Получить текущее потребление памяти в байтах:
print_mem(process)
print(f"total time: {(time.perf_counter()-tt1):.6f} sec")
reader.close()