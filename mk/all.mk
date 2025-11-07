.PHONY: all run watch
all: bin/$(BINFILE) $(S)
run: bin/$(BINFILE) $(S)
	$^
watch: bin/$(BINFILE) $(S)
	@$^ ; while [ $$? -eq 1 ]; do $^ ; done
