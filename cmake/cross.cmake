include(  hw/${HW}/${HW}.cmake    )
include( cpu/${CPU}/${CPU}.cmake  )
include(arch/${ARCH}/${ARCH}.cmake)
include(  os/${OS}/${OS}.cmake    )

string(TOUPPER ${HW}   HW_  )
string(TOUPPER ${CPU}  CPU_ )
string(TOUPPER ${ARCH} ARCH_)
string(TOUPPER ${OS}   OS_  )
