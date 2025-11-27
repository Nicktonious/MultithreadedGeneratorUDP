.PHONY: valg
valg: bin/$(BINFILE) $(S)
	valgrind $^ 2> tmp/$(APP).valgrind

# IP ?= 10.120.100.39
IP ?= 127.0.0.1
PORT ?= 12345
.PHONY: gdbs gdb
gdbs: bin/$(BINFILE) $(S)
	gdbserver $(IP):$(PORT) $^
gdb: bin/$(BINFILE) $(S)
	gdb -nx -x .gdbinit $^

# # Специальные настройки для работы с hugepages
# valgrind --trace-children=yes \
#          --track-origins=yes \
#          --leak-check=full \
#          --show-reachable=yes \
#          ./dpdk_app

# # Для hugepages требуется дополнительная настройка:
# valgrind --soname-synonyms=somalloc=nouserintercepts \
#          ./dpdk_app
