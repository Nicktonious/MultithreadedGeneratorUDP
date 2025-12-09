.PHONY: all run watch
all: bin/$(APP)
run: bin/$(APP)
	$^
watch: bin/$(APP)
# 	@$^ ; while [ $$? -eq 1 ]; do $^ ; done
	@$^ ; while [ true ]; do $^ ; done
