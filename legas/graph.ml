(* Object Graph model in OCaml *)

// directed graph item
module type Object = sig
  type t

  uint ref;// reference counter
  string value; // object label
  Object*[] nest;// ordered refs to other objects
  map<string,Object*> attr;// named refs to other objects

  (** constructor: create empty object *)
  val new: None -> t
  (** constructor: create new labeled object *)
  val new : string -> t
  val tag : t-> string
  val val : t-> string
  val head : t-> string
end

