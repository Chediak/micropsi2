from micropsi_core.world.minecraft.spock.spock.mcp import nbt
from micropsi_core.world.minecraft.spock.spock.bound_buffer import BoundBuffer

magic = open('bigtest.nbt').read()

tags = nbt.decode_nbt(magic)
foo = nbt.encode_nbt(tags)
tags = nbt.decode_nbt(foo)
print tags.pretty_tree()