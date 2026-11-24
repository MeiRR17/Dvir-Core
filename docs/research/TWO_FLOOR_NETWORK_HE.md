# תכנון רשת ביתית דו-קומתית
סטטוס: מחקר בלבד, 2026-11-24. ללא רכש או התקנה.

## מצב מדווח
נתב ו-Windows PC במשרד בקומה התחתונה; חדר אישי ומסכים בקומה העליונה. קיימת אפשרות להעביר כבל בתעלת טלוויזיה. M1 Max מיועד ל-AI; מחשב נייד לעבודה ניידת. מפרט Windows אינו מאומת עקב תמלול לא ברור; אין להניח דגם CPU/GPU/RAM. מחשב נוסף אפשרי ל-Core, מפרט לא ידוע. סינון אינטרנט נשמר.

## טופולוגיית יעד
ISP/filter -> router downstairs -> Cat6A copper Ethernet riser -> upstairs 2.5GbE switch -> M1 Max AI, optional Core mini PC, optional NAS, desk dock. Windows lab remains downstairs initially; optional relocation after noise/heat/access assessment. Router LAN port limits inter-floor throughput; optional downstairs 2.5GbE switch for local high-speed traffic. Internet filtering must not be bypassed.

## Cabling
Prefer certified solid bare-copper Cat6A U/UTP permanent cable, not CCA; Cat6 adequate for 1/2.5GbE up to 100m channel. Cat6A supports 10GbE up to 100m channel (90m permanent link plus patch cords). Check conduit diameter, bends, pull string, local fire rating, separation from mains, existing coax use and permission; do not share mains conduit. Terminate keystones and test all pairs; use certified installer if uncertain. Two cables if conduit permits, otherwise one plus switch. Fiber alternative for electrical isolation/long links; requires transceivers and compatible equipment. Existing coax may support MoCA only after compatibility check.

## Access and latency
SSH/API for AI and development; Windows RDP where edition supports host, or approved remote desktop for graphical workloads. Ethernet propagation roughly 5 ns/m; 30m about 0.15 microseconds one way, excluding switches and endpoints. Remote display latency depends on encoding, network, decoding, refresh and load; measure RTT and throughput. Physical KVM switch for co-located computers, KVM extender over dedicated Cat cable or KVM-over-IP for remote computers; do not confuse HDMI-over-Cat proprietary extenders with Ethernet LAN. Hi-Sec Labs secure KVM is a candidate only if isolation requirements justify cost; no model selected. USB-C dock for laptop display/USB/Ethernet, check display count and bandwidth.

## Placement and phases
A: cable + upstairs switch, use existing devices. B: optional Core mini PC upstairs if always-on required. C: NAS and UPS upstairs on ventilated shelf; backups separate. Keep router downstairs; optionally upstairs access point in bridge mode if Wi-Fi weak, preserving filtering. Windows downstairs initially. No public ports. Remote access only approved, authenticated LAN.

## Open measurements
Cable route length, conduit and coax occupancy, router model/LAN speed, filter type, NIC speeds, actual Windows and candidate mini PC specs, monitor resolution/refresh/input count, budget, power/noise/ventilation. No actual throughput, latency or installation verified.
