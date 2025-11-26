#!/usr/bin/env python3

import os, sys, re
import json

class Tree:
    def __init__(self):
        self.nest = []
        self.slot = {}

    def __floordiv__(self, s):
        if isinstance(s, str): s = S(s)
        self.nest.append(s); return self

    def __getitem__(self, name):
        return self.slot[name]

    def __setitem__(self, name, what):
        self.slot[name] = what

class S(Tree):
    def __init__(self, start=None, end=None):
        super().__init__()
        self.start = start
        self.end = end

    def gen(self, depth=0):
        def tab(depth): return ' ' * 4 * depth
        ret = ''
        ret += f'{tab(depth)}{self.start}\n' if self.start is not None else ''
        for i in self.nest: ret += i.gen(depth + 1)
        ret += f'{tab(depth)}{self.end}\n' if self.end is not None else ''
        return ret

    def __str__(self): return self.gen()

class SourceFile(Tree):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.name = path.split('/')[-1]
        self.base = re.sub(r'\.[a-z]+$', r'', self.name)

    def __enter__(self): return self

    def __exit__(self, exc_type, exc_value, traceback):
        with open(self.path, 'w') as f:
            for i in self.nest:
                print(i, file=f)
        # Return False to propagate exceptions, True to suppress them
        return False

class C(SourceFile):
    def __init__(self, path):
        super().__init__(path)
        self // f'#include "{self.base}.hpp"'

class H(SourceFile):
    def __init__(self, path):
        super().__init__(path)
        self // '#pragma once'

def udp(s):
    a, b, c, d, p = re.findall(r'[0-9]+', s)
    return f'{{pcpp::IPv4Address("{a}.{b}.{c}.{d}"),{p}}}'

def binobj(file):
    ret = file
    ret = re.sub(r'[\/\.]+', r'_', ret)
    return f'_binary{ret}'

def riftek_cfg(jsn, cpp, hpp, model):
    with open(jsn, 'r') as jsn:
        with C(cpp) as c:
            with H(hpp) as h:
                config = json.load(jsn)
                h // '#include "riftek.hpp"'
                h // f'extern RF_CONFIG config_{model};'
                c.config = S(
                    f'RF_CONFIG config_{model} = {{', '};'); c // c.config
                c.config // f'.Device_ID = {config["Device_ID"]},'
                c.config // f'.Protocol = {{{config["Protocol_Version_Major"]},{config["Protocol_Version_Minor"]}}},'
                flags = 'true' if int(config["Flags"]) else 'false'
                c.config // f'.Flags = {flags},'
                c.config // f'.License_hash = {config["License_hash"]},'
                c.config // f'.Exposure_time = {config["Exposure_time_ns"]},'
                c.config // f'.Laser_value = {config["Laser_value"]},'
                c.config // f'.Alignment = {config["Alignment_with_sensor"]},'
                c.config // f'.Scaling_factor = {config["Scaling_factor_mm_per_discr"]},'
                c.config // f'.ZMR = {config["ZMR_mm_x0_1"]},'
                c.config // f'.XEMR = {config["XEMR_mm_x0_1"]},'
                c.config // f'.Bytes_per_point = {config["Bytes_per_point"]},'
                reserved = '{%s}' % str(config["Reserved_38_43"])[1:-1]
                c.config // f'._reserved = {reserved},'
                c.config // f'.Points = {config["Points"]},'

def config_json(jsn, cpp, hpp):
    with open(jsn, 'r') as jsn:
        with C(cpp) as c:
            with H(hpp) as h:
                config = json.load(jsn)
                h // '#include "types.hpp"'
                h // 'extern CONFIG config;'
                c.config = S('CONFIG config = {', '};'); c // c.config
                c.cpuindex = S('.baseCPUIndex = 0,'); c.config // c.cpuindex
                c.groups = S('.groups = {', '},'); c.config // c.groups
                c.sensors = S('.sensors = {', '},'); c.config // c.sensors
                #
                for g in config['groups']:
                    gname = g["name"]
                    assert not re.match(r'^[0-9]+', gname)
                    h // f'extern GROUP {gname};'
                    c.groups // f'&{gname},'
                    #
                    c[gname] = (S(f'GROUP {gname} = {{', '};') //
                                f'.name = "{gname}",')
                    c // c[gname]
                    c[gname] // f'.duration = {g["duration"]},'
                    if g["loop"]:
                        c[gname] // f'.loop = true,'
                    else:
                        c[gname] // f'.loop = false,'
                    c[gname] // f'.freq = {g["freq"]},'
                    # c[gname] // f'.packetSize = {g["packetSize"]},'
                    c[gname]['sensors'] = S(
                        '.sensors = {', '},'); c[gname] // c[gname]['sensors']
                #
                    for s in g['sensors']:
                        sname = s['name']
                        h // f'extern SENSOR {sname};'
                        c[gname]['sensors'] // f'&{sname},'
                        c.sensors // f'&{sname},'
                        c[sname] = S(
                            f'SENSOR {sname} = {{', '};') // f'.name = "{sname}",'; c // c[sname]
                        c[sname] // f'.src = {udp(s["src"])},'
                        c[sname] // f'.dst = {udp(s["dst"])},'
                        c[sname] // f'.sn = {int(s["sn"])},'
                        c[sname] // f'.dataPath = "{s["dataPath"]}",'
                        h // f'extern uint8_t {binobj(s["dataPath"])}_start;'
                        h // f'extern uint8_t {binobj(s["dataPath"])}_end;'
                        c[sname] // f'.start = &{binobj(s["dataPath"])}_start,'
                        c[sname] // f'.end = &{binobj(s["dataPath"])}_end,'
                        size = os.path.getsize(s["dataPath"])
                        c[sname] // f'.size = {size},'
                        c[sname] // f'.packetSize = {g["packetSize"]},'
                        c[sname] // f'.packets = {size//g["packetSize"]},'
                        c[sname] // f'.freq = {g["freq"]}'

if __name__ == "__main__":
    jsn, cpp, hpp = sys.argv[1:3 + 1]
    match jsn:
        case 'etc/config.json': config_json(jsn, cpp, hpp)
        case 'etc/rift_cfg_631.json': riftek_cfg(jsn, cpp, hpp, model=631)
        case _: raise NameError(jsn)
