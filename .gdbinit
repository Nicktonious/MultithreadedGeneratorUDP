target remote :12345
set pagination off
set confirm off
set print pretty on
set sysroot /
# set solib-absolute-prefix /
# set solib-search-path /usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:/usr/lib64:/lib64
set trust-readonly-sections on
break main
info inferiors
info sharedlibrary
continue
