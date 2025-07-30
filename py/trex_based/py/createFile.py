from sys import argv 
import os

def create_random_bin(filename, size_in_mbytes):
    size_in_bytes = size_in_mbytes * 1e6
    with open(filename, 'wb') as f:
        f.write(os.urandom(int(size_in_bytes)))
_, fn, size = argv 
size = float(size)

create_random_bin(fn, size)