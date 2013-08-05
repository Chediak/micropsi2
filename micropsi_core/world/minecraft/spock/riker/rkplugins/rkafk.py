import threading
from micropsi_core.world.minecraft.spock.spock.mcp.mcpacket import Packet
from micropsi_core.world.minecraft.spock.spock.net.cflags import cflags
from micropsi_core.world.minecraft.spock.spock.net.timer import ThreadedTimer

class RKAFKPlugin:
	def __int__(self, client):
		self.client = client

		self.stop_event = threading.Event()
		client.register_dispatch(self.start_timer, 0x01)
		client.register_handler(self.stop_timer, cflags['SOCKET_ERR'], cflags['SOCKET_HUP'], cflags['KILL_EVENT'])
		client.register_dispatch(self.stop_timer, 0xFF)

	def start_timer(self, *args):
		ThreadedTimer(self.stop_event, 1, self.move, -1).start()

	def stop_timer(self, *args):
		self.stop_event.set()
		self.stop_event = threading.Event()

	def move(self, *args):
		self.client.push_move(Packet(ident = 0x0C, data = {
			'yaw': 0,
			'pitch': 0,
			'on_ground': False,
			})
		)