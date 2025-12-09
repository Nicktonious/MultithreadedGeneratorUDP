let sync () =
  touch "mk/sync.mk" ~c:".PHONY: sync
sync: $(HOME)/.unison/$(APP).prf doc
\tunison $(APP)
$(HOME)/.unison/$(APP).prf: $(CWD)/.unison
\tln -fs $< $@
" ()

let unison () =
  Sys.command ("ln -fs ~/"^app^"/.unison ~/.unison/"^app^".prf");;
  touch ".unison" ~c:("# .unicon
## cd ~/.unison ; ln -fs ~/"^app^"/.unison "^app^".prf ; cd ~/"^app^" ; ls -la ~/.unison

# Название профиля (опционально)
label = "^app^" sync

# Корневые директории
root = /home/"^user^"/"^app^"
root = ssh://"^devuser^"@"^devserver^"//home/"^devuser^"/"^app^"

# Автоматизация
auto   = true
batch  = true
prefer = newer

# Игнорирование специфичных файлов и кэшей
# ignore = Name {.unison}
ignore = Name {.git}
ignore = Name {*~,*.log,*.sw?}
ignore = Name {bin,tmp,ref}
ignore = Name {doc/html,lib/pcpp}
ignore = Name {node_modules,.cache}
ignore = Name {*.pyc,__pycache__}
") ()
