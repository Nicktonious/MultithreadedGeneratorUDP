.PHONY: all run
all: bin/$(BINFILE) $(S)
run: bin/$(BINFILE) $(S)
	$^

.PHONY: send recv
send: bin/$(BINFILE)
	$< -send veths
recv: bin/$(BINFILE)
	$< -recv vethr
