.PHONY: format
format: tmp/format_cpp

tmp/format_cpp: $(C) $(H)
	$(CF) $? && touch $@
