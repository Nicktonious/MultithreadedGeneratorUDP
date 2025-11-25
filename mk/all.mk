.PHONY: all run watch
all: bin/$(APP) $(S)
run: bin/$(APP) $(S)
	sudo $^
watch: bin/$(APP) $(S)
# 	@$^ ; while [ true ]; do $^ ; done
	@$^ ; while [ $$? -eq 1 ]; do $^ ; done
