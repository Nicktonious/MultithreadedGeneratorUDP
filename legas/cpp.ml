let hpp () = 
  touch ("inc/app.hpp") ~c:"#pragma once

#include <iostream>

extern int main(int argc, char* argv[]);
extern void setup(int argc, char* argv[]);
extern void arg(int argc, char* argv);
extern int loop();
" ();

let cpp () =
  touch
    ("src/main.cpp")
    ~c:("#include \"app.hpp\"

int main(int argc, char* argv[]) {  //
    arg(0, argv[0]);
    setup(argc,argv);
    for (int i = 1; i < argc; i++) arg(i, argv[i]);
    return loop;
}

void arg(int argc, char* argv) {  //
    std::clog << \"arg[\" << argc << \"] = <\" << argv << \"]\\n\";
}
")
    ();;

let ini() =   
  touch     ("lib/" ^ app ^ ".ini") ~c:"# line comment\n" ()
