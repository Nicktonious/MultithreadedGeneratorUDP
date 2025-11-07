.PHONY: ai tmp/$(APP).ai.md
ai: tmp/$(APP).ai.md
tmp/$(APP).ai.md: doc
	cat README.md doc/*.md $(C) $(H) $(LX) > $@ ; touch $@
