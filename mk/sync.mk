.PHONY: sync
sync: $(HOME)/.unison/pcapp_based.prf doc
	unison pcapp_based
$(HOME)/.unison/pcapp_based.prf: $(CWD)/.unison
	ln -fs $< $@
