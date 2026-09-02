import { i as __toESM } from "../_runtime.mjs";
import { A as TetrahedronGeometry, D as SRGBColorSpace, E as Raycaster, I as require_jsx_runtime, L as require_react, M as TorusKnotGeometry, N as Vector2, P as Vector3, S as MeshStandardMaterial, a as useThree, b as Mesh, c as Box3, d as ConeGeometry, f as CylinderGeometry, g as IcosahedronGeometry, h as Group, i as Canvas, j as TorusGeometry, k as SphereGeometry, l as BoxGeometry, m as EdgesGeometry, n as Grid, p as DodecahedronGeometry, r as OrbitControls, s as PMREMGenerator, t as ContactShadows, u as CapsuleGeometry, v as LineBasicMaterial, w as OctahedronGeometry, y as LineSegments } from "../_libs/@react-three/drei+[...].mjs";
import { a as RotateCcw, c as PinOff, d as EyeOff, f as Download, i as Save, l as Moon, m as Camera, o as RefreshCw, p as Dices, r as Sun, s as Pin, t as Upload, u as Eye } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { n as RoomEnvironment, t as RoundedBoxGeometry } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BzTENTXP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-1.5 font-medium transition-[opacity,transform,background-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			ghost: "bg-transparent text-fg hover:bg-surface",
			outline: "border border-border bg-transparent text-fg hover:bg-surface",
			accent: "bg-signal text-signal-fg hover:opacity-90"
		},
		size: {
			sm: "h-8 rounded-sm px-2.5 text-xs",
			md: "h-10 rounded-md px-3 text-sm",
			icon: "size-10 rounded-md",
			iconSm: "size-8 rounded-sm"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "md"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function lettersWithout(ch) {
	return AZ.replace(ch, "");
}
function buildCodes() {
	const quads = [
		["S", "S"],
		["S", "R"],
		["R", "S"],
		["R", "R"]
	];
	const out = [];
	let serial = 1;
	for (const [major, form] of quads) {
		const letters = lettersWithout(form);
		for (let i = 0; i < letters.length; i++) {
			const letter = letters[i];
			out.push({
				id: `${major}${form}${letter}-${String(serial).padStart(3, "0")}`,
				serial,
				major,
				form,
				letter,
				complexity: i
			});
			serial += 1;
		}
	}
	return out;
}
var STYLES = buildCodes();
var STYLE_BY_ID = Object.fromEntries(STYLES.map((s) => [s.id, s]));
var DEFAULT_STYLE = STYLES[0].id;
var QUAD_RANGES = [
	{
		id: "SS",
		label: "SS 001–025",
		from: 1,
		to: 25
	},
	{
		id: "SR",
		label: "SR 026–050",
		from: 26,
		to: 50
	},
	{
		id: "RS",
		label: "RS 051–075",
		from: 51,
		to: 75
	},
	{
		id: "RR",
		label: "RR 076–100",
		from: 76,
		to: 100
	}
];
var armorVars = STYLES.map((s) => ({
	id: s.id,
	name: s.id
}));
var WEAPON_VARS = [
	{
		id: "none",
		name: "None"
	},
	{
		id: "rifle",
		name: "Beam Rifle"
	},
	{
		id: "longrifle",
		name: "Long Rifle"
	},
	{
		id: "machinegun",
		name: "Machine Gun"
	},
	{
		id: "cannon",
		name: "Cannon"
	},
	{
		id: "shotgun",
		name: "Shotgun"
	},
	{
		id: "sniper",
		name: "Sniper"
	},
	{
		id: "pistol",
		name: "Pistol"
	},
	{
		id: "smg",
		name: "SMG"
	},
	{
		id: "bazooka",
		name: "Bazooka"
	},
	{
		id: "vulcan",
		name: "Vulcan"
	},
	{
		id: "saber",
		name: "Beam Saber"
	},
	{
		id: "beamdagger",
		name: "Beam Dagger"
	},
	{
		id: "naginata",
		name: "Beam Naginata"
	},
	{
		id: "twin",
		name: "Twin Beam"
	},
	{
		id: "dagger",
		name: "Dagger"
	},
	{
		id: "longsword",
		name: "Longsword"
	},
	{
		id: "axe",
		name: "Axe"
	},
	{
		id: "hammer",
		name: "Hammer"
	},
	{
		id: "spear",
		name: "Spear"
	},
	{
		id: "mace",
		name: "Mace"
	}
];
var SHIELD_VARS = [
	{
		id: "none",
		name: "None"
	},
	{
		id: "kite",
		name: "Kite"
	},
	{
		id: "round",
		name: "Round"
	},
	{
		id: "tower",
		name: "Tower"
	},
	{
		id: "buckler",
		name: "Buckler"
	},
	{
		id: "heater",
		name: "Heater"
	},
	{
		id: "scutum",
		name: "Scutum"
	},
	{
		id: "hex",
		name: "Hex"
	},
	{
		id: "penta",
		name: "Pentagon"
	},
	{
		id: "oval",
		name: "Oval"
	},
	{
		id: "delta",
		name: "Delta"
	},
	{
		id: "cross",
		name: "Cross"
	},
	{
		id: "spike",
		name: "Spiked"
	},
	{
		id: "wing",
		name: "Wing"
	},
	{
		id: "slab",
		name: "Slab"
	},
	{
		id: "dish",
		name: "Dish"
	},
	{
		id: "blade",
		name: "Blade"
	},
	{
		id: "lattice",
		name: "Lattice"
	},
	{
		id: "diamond",
		name: "Diamond"
	},
	{
		id: "capsule",
		name: "Capsule"
	},
	{
		id: "layer",
		name: "Layered"
	}
];
var BEAM_MELEE = /* @__PURE__ */ new Set([
	"saber",
	"beamdagger",
	"naginata",
	"twin"
]);
var EXTRA_VARS = [
	{
		id: "none",
		name: "None"
	},
	{
		id: "booster",
		name: "Booster",
		cls: "M"
	},
	{
		id: "twinboost",
		name: "Twin Booster",
		cls: "M"
	},
	{
		id: "container",
		name: "Container",
		cls: "M"
	},
	{
		id: "pod",
		name: "Pod",
		cls: "M"
	},
	{
		id: "propellant",
		name: "Propellant",
		cls: "M"
	},
	{
		id: "binderwing",
		name: "Binder Wing",
		cls: "M"
	},
	{
		id: "hardpoint",
		name: "Hardpoint",
		cls: "M"
	},
	{
		id: "droptank",
		name: "Drop Tank",
		cls: "M"
	},
	{
		id: "shieldbinder",
		name: "Shield Binder",
		cls: "M"
	},
	{
		id: "vernier",
		name: "Vernier",
		cls: "M"
	},
	{
		id: "packext",
		name: "Pack Ext",
		cls: "M"
	},
	{
		id: "skirtbinder",
		name: "Skirt Binder",
		cls: "M"
	},
	{
		id: "shoulderpod",
		name: "Shoulder Pod",
		cls: "M"
	},
	{
		id: "hipcontainer",
		name: "Hip Container",
		cls: "M"
	},
	{
		id: "thrusterring",
		name: "Thruster Ring",
		cls: "M"
	},
	{
		id: "conformaltank",
		name: "Conformal Tank",
		cls: "M"
	},
	{
		id: "twinwing",
		name: "Twin Wing",
		cls: "M"
	},
	{
		id: "radome",
		name: "Radome",
		cls: "M"
	},
	{
		id: "cooler",
		name: "Cooler",
		cls: "M"
	},
	{
		id: "stealthplate",
		name: "Stealth Plate",
		cls: "M"
	},
	{
		id: "deltaWing",
		name: "Delta Wing",
		cls: "M"
	},
	{
		id: "sweptWing",
		name: "Swept Wing",
		cls: "M"
	},
	{
		id: "canardWing",
		name: "Canard Wing",
		cls: "M"
	},
	{
		id: "stubWing",
		name: "Stub Wing",
		cls: "M"
	},
	{
		id: "scissorWing",
		name: "Scissor Wing",
		cls: "M"
	},
	{
		id: "shouldercannon",
		name: "Shoulder Cannon",
		cls: "W"
	},
	{
		id: "missilepod",
		name: "Missile Pod",
		cls: "W"
	},
	{
		id: "saberrack",
		name: "Saber Rack",
		cls: "W"
	},
	{
		id: "grenaderack",
		name: "Grenade Rack",
		cls: "W"
	},
	{
		id: "longcannon",
		name: "Long Cannon",
		cls: "W"
	},
	{
		id: "gatling",
		name: "Gatling",
		cls: "W"
	},
	{
		id: "railgun",
		name: "Railgun",
		cls: "W"
	},
	{
		id: "shotcannon",
		name: "Scatter Cannon",
		cls: "W"
	},
	{
		id: "heathawk",
		name: "Heat Hawk",
		cls: "W"
	},
	{
		id: "lancepod",
		name: "Lance",
		cls: "W"
	},
	{
		id: "megacannon",
		name: "Mega Cannon",
		cls: "W"
	},
	{
		id: "bitrack",
		name: "Bit Rack",
		cls: "W"
	},
	{
		id: "armcannon",
		name: "Arm Cannon",
		cls: "W"
	},
	{
		id: "chestvulcan",
		name: "Chest Vulcan",
		cls: "W"
	},
	{
		id: "armgatling",
		name: "Arm Gatling",
		cls: "W"
	},
	{
		id: "rocket",
		name: "Rocket",
		cls: "W"
	},
	{
		id: "twinsaber",
		name: "Twin Saber",
		cls: "W"
	},
	{
		id: "shieldcannon",
		name: "Shield Cannon",
		cls: "W"
	},
	{
		id: "sniper",
		name: "Sniper",
		cls: "W"
	},
	{
		id: "cluster",
		name: "Cluster",
		cls: "W"
	},
	{
		id: "bladeantenna",
		name: "Blade Antenna",
		cls: "A"
	},
	{
		id: "twinantenna",
		name: "Twin Antenna",
		cls: "A"
	},
	{
		id: "glowfin",
		name: "Glow Fin",
		cls: "A"
	},
	{
		id: "crestplate",
		name: "Crest",
		cls: "A"
	},
	{
		id: "cameraeye",
		name: "Camera Eye",
		cls: "A"
	},
	{
		id: "sensorhorn",
		name: "Sensor Horn",
		cls: "A"
	},
	{
		id: "headvulcan",
		name: "Head Vulcan",
		cls: "A"
	},
	{
		id: "bitunit",
		name: "Bit Unit",
		cls: "A"
	},
	{
		id: "glowstrip",
		name: "Glow Strip",
		cls: "A"
	},
	{
		id: "finblade",
		name: "Fin Blade",
		cls: "A"
	},
	{
		id: "chinspike",
		name: "Chin Spike",
		cls: "A"
	},
	{
		id: "cheekblade",
		name: "Cheek Blade",
		cls: "A"
	},
	{
		id: "headcamera",
		name: "Head Camera",
		cls: "A"
	},
	{
		id: "commantenna",
		name: "Comm Antenna",
		cls: "A"
	},
	{
		id: "haloring",
		name: "Halo Ring",
		cls: "A"
	},
	{
		id: "sidespike",
		name: "Side Spike",
		cls: "A"
	},
	{
		id: "coregem",
		name: "Core Gem",
		cls: "A"
	},
	{
		id: "tailstab",
		name: "Tail Stab",
		cls: "A"
	},
	{
		id: "skirtspike",
		name: "Skirt Spike",
		cls: "A"
	},
	{
		id: "shoulderspike",
		name: "Shoulder Spike",
		cls: "A"
	},
	{
		id: "cube",
		name: "Cube",
		cls: "G"
	},
	{
		id: "cuboid",
		name: "Cuboid",
		cls: "G"
	},
	{
		id: "sphere",
		name: "Sphere",
		cls: "G"
	},
	{
		id: "cylinder",
		name: "Cylinder",
		cls: "G"
	},
	{
		id: "cone",
		name: "Cone",
		cls: "G"
	},
	{
		id: "torus",
		name: "Torus",
		cls: "G"
	},
	{
		id: "tetra",
		name: "Tetra",
		cls: "G"
	},
	{
		id: "octa",
		name: "Octa",
		cls: "G"
	},
	{
		id: "dodeca",
		name: "Dodeca",
		cls: "G"
	},
	{
		id: "icosa",
		name: "Icosa",
		cls: "G"
	},
	{
		id: "pyramid",
		name: "Pyramid",
		cls: "G"
	},
	{
		id: "prism",
		name: "Prism",
		cls: "G"
	},
	{
		id: "hexprism",
		name: "Hex Prism",
		cls: "G"
	},
	{
		id: "capsule",
		name: "Capsule",
		cls: "G"
	},
	{
		id: "disc",
		name: "Disc",
		cls: "G"
	},
	{
		id: "ring",
		name: "Ring",
		cls: "G"
	},
	{
		id: "wedge",
		name: "Wedge",
		cls: "G"
	},
	{
		id: "cross",
		name: "Cross",
		cls: "G"
	},
	{
		id: "hemisphere",
		name: "Hemisphere",
		cls: "G"
	},
	{
		id: "knot",
		name: "Knot",
		cls: "G"
	}
];
var WING_IDS = [
	"deltaWing",
	"sweptWing",
	"canardWing",
	"stubWing",
	"scissorWing"
];
var MOD_IDS = EXTRA_VARS.filter((v) => v.cls === "M").map((v) => v.id);
var WPN_IDS = EXTRA_VARS.filter((v) => v.cls === "W").map((v) => v.id);
var ACC_IDS = EXTRA_VARS.filter((v) => v.cls === "A").map((v) => v.id);
var EXTRA_LEGACY = {
	funnel: "bitunit",
	booster: "booster",
	missile: "missilepod",
	cannon: "shouldercannon",
	binder: "binderwing",
	sensor: "bladeantenna",
	rack: "saberrack",
	"M-01": "booster",
	"M-02": "twinboost",
	"M-03": "container",
	"M-04": "pod",
	"M-05": "propellant",
	"M-06": "binderwing",
	"M-07": "hardpoint",
	"M-08": "droptank",
	"M-09": "shieldbinder",
	"M-10": "vernier",
	"M-11": "packext",
	"M-12": "skirtbinder",
	"M-13": "shoulderpod",
	"M-14": "hipcontainer",
	"M-15": "thrusterring",
	"M-16": "conformaltank",
	"M-17": "twinwing",
	"M-18": "radome",
	"M-19": "cooler",
	"M-20": "stealthplate",
	"W-01": "shouldercannon",
	"W-02": "missilepod",
	"W-03": "saberrack",
	"W-04": "grenaderack",
	"W-05": "longcannon",
	"W-06": "gatling",
	"W-07": "railgun",
	"W-08": "shotcannon",
	"W-09": "heathawk",
	"W-10": "lancepod",
	"W-11": "megacannon",
	"W-12": "bitrack",
	"W-13": "armcannon",
	"W-14": "chestvulcan",
	"W-15": "armgatling",
	"W-16": "rocket",
	"W-17": "twinsaber",
	"W-18": "shieldcannon",
	"W-19": "sniper",
	"W-20": "cluster",
	"A-01": "bladeantenna",
	"A-02": "twinantenna",
	"A-03": "glowfin",
	"A-04": "crestplate",
	"A-05": "cameraeye",
	"A-06": "sensorhorn",
	"A-07": "headvulcan",
	"A-08": "bitunit",
	"A-09": "glowstrip",
	"A-10": "finblade",
	"A-11": "chinspike",
	"A-12": "cheekblade",
	"A-13": "headcamera",
	"A-14": "commantenna",
	"A-15": "haloring",
	"A-16": "sidespike",
	"A-17": "coregem",
	"A-18": "tailstab",
	"A-19": "skirtspike",
	"A-20": "shoulderspike"
};
function S(id, group, label, socket, extra = {}) {
	return {
		id,
		group,
		label,
		socket,
		kind: "armor",
		defaultVariant: DEFAULT_STYLE,
		variants: armorVars,
		...extra
	};
}
var SLOTS = [
	S("helm", "head", "Helm", [
		0,
		1.84,
		.02
	]),
	S("visor", "head", "Visor", [
		0,
		1.82,
		.16
	]),
	S("brow", "head", "Brow", [
		0,
		1.92,
		.14
	]),
	S("eyeL", "head", "Eye L", [
		-.08,
		1.84,
		.18
	], { mirror: "eyeR" }),
	S("eyeR", "head", "Eye R", [
		.08,
		1.84,
		.18
	], { mirror: "eyeL" }),
	S("nose", "head", "Nose", [
		0,
		1.8,
		.2
	]),
	S("mouth", "head", "Mouth", [
		0,
		1.74,
		.18
	]),
	S("jaw", "head", "Jaw", [
		0,
		1.66,
		.12
	]),
	S("earL", "head", "Ear L", [
		-.22,
		1.82,
		0
	], {
		optional: true,
		mirror: "earR"
	}),
	S("earR", "head", "Ear R", [
		.22,
		1.82,
		0
	], {
		optional: true,
		mirror: "earL"
	}),
	S("vfin", "head", "Crest", [
		0,
		2.02,
		.02
	]),
	S("antennaL", "head", "Antenna L", [
		-.16,
		1.94,
		0
	], {
		optional: true,
		mirror: "antennaR"
	}),
	S("antennaR", "head", "Antenna R", [
		.16,
		1.94,
		0
	], {
		optional: true,
		mirror: "antennaL"
	}),
	S("cheekL", "head", "Cheek L", [
		-.2,
		1.76,
		.08
	], { mirror: "cheekR" }),
	S("cheekR", "head", "Cheek R", [
		.2,
		1.76,
		.08
	], { mirror: "cheekL" }),
	S("chin", "head", "Chin Guard", [
		0,
		1.68,
		.14
	]),
	S("collar", "torso", "Collar", [
		0,
		1.64,
		.02
	]),
	S("chestCore", "torso", "Chest Core", [
		0,
		1.46,
		.04
	]),
	S("pecL", "torso", "Pec L", [
		-.16,
		1.48,
		.1
	], { mirror: "pecR" }),
	S("pecR", "torso", "Pec R", [
		.16,
		1.48,
		.1
	], { mirror: "pecL" }),
	S("cockpit", "torso", "Cockpit", [
		0,
		1.44,
		.18
	]),
	S("abdomen", "torso", "Abdomen", [
		0,
		1.26,
		.04
	]),
	S("pelvis", "waist", "Pelvis", [
		0,
		1.1,
		0
	]),
	S("skirtF", "waist", "Skirt F", [
		0,
		1.04,
		.14
	]),
	S("skirtB", "waist", "Skirt B", [
		0,
		1.04,
		-.12
	]),
	S("skirtL", "waist", "Skirt L", [
		-.2,
		1.04,
		0
	], { mirror: "skirtR" }),
	S("skirtR", "waist", "Skirt R", [
		.2,
		1.04,
		0
	], { mirror: "skirtL" }),
	S("shoulderR", "armR", "Shoulder R", [
		.4,
		1.54,
		0
	], { mirror: "shoulderL" }),
	S("upperR", "armR", "Upper R", [
		.52,
		1.3,
		0
	], { mirror: "upperL" }),
	S("elbowR", "armR", "Elbow R", [
		.54,
		1.12,
		0
	], { mirror: "elbowL" }),
	S("forearmR", "armR", "Forearm R", [
		.56,
		.94,
		0
	], { mirror: "forearmL" }),
	S("vambraceR", "armR", "Vambrace R", [
		.58,
		.9,
		.04
	], { mirror: "vambraceL" }),
	S("handR", "armR", "Hand R", [
		.56,
		.74,
		.02
	], { mirror: "handL" }),
	S("shoulderL", "armL", "Shoulder L", [
		-.4,
		1.54,
		0
	], { mirror: "shoulderR" }),
	S("upperL", "armL", "Upper L", [
		-.52,
		1.3,
		0
	], { mirror: "upperR" }),
	S("elbowL", "armL", "Elbow L", [
		-.54,
		1.12,
		0
	], { mirror: "elbowR" }),
	S("forearmL", "armL", "Forearm L", [
		-.56,
		.94,
		0
	], { mirror: "forearmR" }),
	S("vambraceL", "armL", "Vambrace L", [
		-.58,
		.9,
		.04
	], { mirror: "vambraceR" }),
	S("handL", "armL", "Hand L", [
		-.56,
		.74,
		.02
	], { mirror: "handR" }),
	S("hipR", "legR", "Hip R", [
		.14,
		1,
		0
	], { mirror: "hipL" }),
	S("thighR", "legR", "Thigh R", [
		.16,
		.72,
		0
	], { mirror: "thighL" }),
	S("kneeR", "legR", "Knee R", [
		.16,
		.46,
		.04
	], { mirror: "kneeL" }),
	S("shinR", "legR", "Shin R", [
		.16,
		.24,
		.02
	], { mirror: "shinL" }),
	S("ankleR", "legR", "Ankle R", [
		.16,
		.1,
		0
	], { mirror: "ankleL" }),
	S("footR", "legR", "Foot R", [
		.16,
		.04,
		.04
	], { mirror: "footL" }),
	S("hipL", "legL", "Hip L", [
		-.14,
		1,
		0
	], { mirror: "hipR" }),
	S("thighL", "legL", "Thigh L", [
		-.16,
		.72,
		0
	], { mirror: "thighR" }),
	S("kneeL", "legL", "Knee L", [
		-.16,
		.46,
		.04
	], { mirror: "kneeR" }),
	S("shinL", "legL", "Shin L", [
		-.16,
		.24,
		.02
	], { mirror: "shinR" }),
	S("ankleL", "legL", "Ankle L", [
		-.16,
		.1,
		0
	], { mirror: "ankleR" }),
	S("footL", "legL", "Foot L", [
		-.16,
		.04,
		.04
	], { mirror: "footR" }),
	S("pack", "back", "Pack Core", [
		0,
		1.5,
		-.22
	]),
	S("thrusterL", "back", "Thruster L", [
		-.16,
		1.46,
		-.3
	], { mirror: "thrusterR" }),
	S("thrusterR", "back", "Thruster R", [
		.16,
		1.46,
		-.3
	], { mirror: "thrusterL" }),
	S("binderL", "back", "Binder L", [
		-.28,
		1.52,
		-.18
	], {
		optional: true,
		defaultVariant: STYLES[26]?.id ?? DEFAULT_STYLE,
		mirror: "binderR"
	}),
	S("binderR", "back", "Binder R", [
		.28,
		1.52,
		-.18
	], {
		optional: true,
		defaultVariant: STYLES[26]?.id ?? DEFAULT_STYLE,
		mirror: "binderL"
	}),
	S("stabilizer", "back", "Stabilizer", [
		0,
		1.32,
		-.24
	], { optional: true }),
	{
		id: "weaponR",
		group: "weapon",
		label: "Weapon R",
		socket: [
			.56,
			.74,
			.02
		],
		kind: "weapon",
		defaultVariant: "none",
		variants: WEAPON_VARS
	},
	{
		id: "weaponL",
		group: "weapon",
		label: "Weapon L",
		socket: [
			-.56,
			.74,
			.02
		],
		kind: "weapon",
		defaultVariant: "none",
		variants: WEAPON_VARS
	},
	{
		id: "shield",
		group: "weapon",
		label: "Shield",
		socket: [
			-.58,
			1,
			.04
		],
		kind: "weapon",
		defaultVariant: "none",
		variants: SHIELD_VARS
	},
	...[
		[
			"extra1",
			"R Shoulder",
			[
				.48,
				1.62,
				-.08
			]
		],
		[
			"extra2",
			"L Shoulder",
			[
				-.48,
				1.62,
				-.08
			]
		],
		[
			"extra3",
			"R Hip",
			[
				.26,
				1.08,
				.16
			]
		],
		[
			"extra4",
			"L Hip",
			[
				-.26,
				1.08,
				.16
			]
		],
		[
			"extra5",
			"Head Rear",
			[
				0,
				1.72,
				-.28
			]
		],
		[
			"extra6",
			"Waist Rear",
			[
				0,
				1.2,
				-.32
			]
		],
		[
			"extra7",
			"Face Front",
			[
				0,
				1.82,
				.28
			]
		],
		[
			"extra8",
			"Chest",
			[
				0,
				1.44,
				.26
			]
		],
		[
			"extra9",
			"Forearm R",
			[
				.62,
				.92,
				.1
			]
		],
		[
			"extra10",
			"Forearm L",
			[
				-.62,
				.92,
				.1
			]
		]
	].map(([id, label, socket]) => ({
		id,
		group: "extra",
		label,
		socket,
		kind: "extra",
		optional: true,
		defaultVariant: "none",
		variants: EXTRA_VARS
	}))
];
var SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s]));
var GROUP_ROOT = {
	head: "helm",
	torso: "chestCore",
	waist: "pelvis",
	armR: "shoulderR",
	armL: "shoulderL",
	legR: "hipR",
	legL: "hipL",
	back: "pack",
	weapon: "weaponR",
	extra: "extra1"
};
function isLeftSlot(id) {
	return /L$/.test(id) || id === "weaponL";
}
function isVisorSlot(id) {
	return id === "visor" || id === "eyeL" || id === "eyeR";
}
function variantLabel(slotId, variant) {
	return SLOT_BY_ID[slotId]?.variants.find((v) => v.id === variant)?.name ?? variant;
}
STYLES.map((s) => ({
	id: s.id,
	name: s.id,
	blurb: `${s.major}${s.form}${s.letter}`
}));
var GROUPS = [
	{
		id: "head",
		label: "Head"
	},
	{
		id: "torso",
		label: "Torso"
	},
	{
		id: "waist",
		label: "Waist"
	},
	{
		id: "armR",
		label: "Arm R"
	},
	{
		id: "armL",
		label: "Arm L"
	},
	{
		id: "legR",
		label: "Leg R"
	},
	{
		id: "legL",
		label: "Leg L"
	},
	{
		id: "back",
		label: "Back"
	},
	{
		id: "weapon",
		label: "Weapons"
	},
	{
		id: "extra",
		label: "Extra"
	}
];
var IDENTITY = {
	px: 0,
	py: 0,
	pz: 0,
	rx: 0,
	ry: 0,
	rz: 0,
	sx: 1,
	sy: 1,
	sz: 1
};
var CANONS = [
	"soldier",
	"brute",
	"stalker",
	"heavy",
	"runner",
	"totem",
	"drone",
	"knight"
];
var HELMS_SPARSE = [
	"blunt",
	"hex",
	"wedge",
	"bucket",
	"shelf",
	"diamond",
	"split",
	"trap",
	"snout",
	"hood",
	"step",
	"gem"
];
var HELMS_ORNATE = [
	"anvil",
	"arrow",
	"beak",
	"clam",
	"plow",
	"tower",
	"mask",
	"cap",
	"ram",
	"ridge",
	"facet",
	"hawk",
	"cage"
];
var VISORS_SPARSE = [
	"slit",
	"bar",
	"thin",
	"recess",
	"dual",
	"tee",
	"mono",
	"notch",
	"plus",
	"window",
	"penta",
	"strip"
];
var VISORS_ORNATE = [
	"dome",
	"visorV",
	"visorX",
	"diamond",
	"visorHex",
	"visorBar2",
	"visorCrest",
	"visorSplit",
	"visorRing",
	"visorGem",
	"visorMask",
	"visorArrow",
	"visorWide"
];
var CRESTS = [
	"fin",
	"twin",
	"mast",
	"crown",
	"halo",
	"wing",
	"teeth",
	"cloak",
	"blade",
	"spike",
	"horn",
	"plow",
	"ram"
];
var CHESTS_SPARSE = [
	"plow",
	"wedge",
	"hex",
	"rib",
	"slim",
	"bulk",
	"shield",
	"cage",
	"core",
	"barrel",
	"slab",
	"peak"
];
var CHESTS_ORNATE = [
	"fortress",
	"reactor",
	"grate",
	"crystal",
	"hump",
	"delta",
	"lattice",
	"boiler",
	"armature",
	"altar",
	"carapace",
	"turbine",
	"wingbox"
];
var PACKS_SPARSE = [
	"box",
	"spine",
	"mast",
	"twin",
	"wing",
	"tank",
	"shell",
	"halo",
	"brick",
	"fin",
	"rack",
	"plate"
];
var PACKS_ORNATE = [
	"booster",
	"scythe",
	"ring",
	"pod",
	"sail",
	"turret",
	"canopy",
	"claw",
	"fold",
	"disc",
	"arch",
	"stack",
	"crystal"
];
var LIMBS_SPARSE = [
	"block",
	"plate",
	"frame",
	"pipe",
	"slab",
	"beam",
	"hinge",
	"boxer",
	"post",
	"rail",
	"brick",
	"channel"
];
var LIMBS_ORNATE = [
	"blade",
	"capsule",
	"claw",
	"piston",
	"armor",
	"spike",
	"ribbon",
	"tanked",
	"lattice",
	"cannon",
	"pauldron",
	"ornate",
	"talon"
];
function hsl(h, s, l) {
	const a = s / 100;
	const k = (n) => (n + h / 30) % 12;
	const f = (n) => l / 100 - a * Math.min(l / 100, 1 - l / 100) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	const to = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
	return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}
function paletteFor(code, quad) {
	const shift = code.serial * 9.7 % 360;
	if (quad === "SS") return {
		prim: hsl((38 + shift * .08) % 360, 8, 84 - code.complexity * .5),
		sec: hsl((220 + shift * .15) % 360, 12, 20),
		acc: hsl((6 + shift * .4) % 360, 62, 42),
		trim: hsl((42 + shift * .2) % 360, 48, 56)
	};
	if (quad === "SR") return {
		prim: hsl((48 + shift * .1) % 360, 10, 80),
		sec: hsl((210 + shift * .18) % 360, 28, 28),
		acc: hsl((8 + shift * .3) % 360, 55, 40),
		trim: hsl((40 + shift * .2) % 360, 38, 58)
	};
	if (quad === "RS") return {
		prim: hsl((300 + shift * .08) % 360, 8, 82),
		sec: hsl((320 + shift * .15) % 360, 16, 22),
		acc: hsl((16 + shift * .4) % 360, 58, 46),
		trim: hsl((200 + shift * .2) % 360, 18, 60)
	};
	return {
		prim: hsl((28 + shift * .1) % 360, 14, 78),
		sec: hsl((210 + shift * .12) % 360, 14, 28),
		acc: hsl((200 + shift * .35) % 360, 40, 42),
		trim: hsl((36 + shift * .2) % 360, 22, 64)
	};
}
function segsFor(quad, density) {
	if (quad === "SS") return 4 + Math.floor(density / 3);
	if (quad === "SR") return 8 + density;
	if (quad === "RS") return 10 + density;
	return 16 + density;
}
function curveFor(quad) {
	if (quad === "SS") return 0;
	if (quad === "SR") return .42;
	if (quad === "RS") return .06;
	return .86;
}
function canonFor(quad, rank) {
	return CANONS[(rank + (quad === "SS" ? 0 : quad === "SR" ? 2 : quad === "RS" ? 4 : 6)) % CANONS.length];
}
function buildRecipe(code) {
	const quad = `${code.major}${code.form}`;
	const rank = code.complexity;
	const ornate = rank >= 12;
	const density = ornate ? Math.min(12, rank - 11) : rank + 1;
	const oi = rank - 12;
	const canon = canonFor(quad, rank);
	return {
		id: code.id,
		code,
		quad,
		rank,
		density,
		ornate,
		helm: ornate ? HELMS_ORNATE[oi] : HELMS_SPARSE[rank],
		visor: ornate ? VISORS_ORNATE[oi] : VISORS_SPARSE[rank],
		crest: ornate ? CRESTS[oi] : "none",
		chest: ornate ? CHESTS_ORNATE[oi] : CHESTS_SPARSE[rank],
		pack: ornate ? PACKS_ORNATE[oi] : PACKS_SPARSE[rank],
		limb: ornate ? LIMBS_ORNATE[oi] : LIMBS_SPARSE[rank],
		canon,
		curve: curveFor(quad),
		segs: segsFor(quad, density),
		greeble: density,
		height: canon === "stalker" || canon === "runner" ? 1.04 : canon === "brute" || canon === "heavy" ? .92 : .98,
		shoulder: canon === "heavy" || canon === "brute" ? 1.06 : canon === "stalker" ? .88 : .96,
		hip: canon === "heavy" ? 1.04 : canon === "runner" ? .9 : .96,
		head: .96,
		thick: canon === "heavy" || canon === "brute" ? 1.05 : canon === "drone" ? .88 : .96,
		torso: canon === "heavy" ? 1.06 : canon === "stalker" ? .9 : .98,
		palette: paletteFor(code, quad)
	};
}
var RECIPES = STYLES.map(buildRecipe);
var RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
function getRecipe(id) {
	return RECIPE_BY_ID[id] ?? RECIPES[0];
}
var shared = /* @__PURE__ */ new Map();
var lineMatDark = new LineBasicMaterial({
	color: 1710622,
	transparent: true,
	opacity: .35
});
var lineMatLight = new LineBasicMaterial({
	color: 2763312,
	transparent: true,
	opacity: .28
});
function std(color, extra = {}) {
	return new MeshStandardMaterial({
		color,
		metalness: .34,
		roughness: .4,
		envMapIntensity: 1.15,
		...extra
	});
}
function getLineMat(theme = "dark") {
	return theme === "light" ? lineMatLight : lineMatDark;
}
var DEFAULT_VISOR = "#79d7ff";
function hexToHsb(hex) {
	const n = hex.replace("#", "");
	if (n.length < 6) return {
		h: 196,
		s: 52,
		b: 100
	};
	const r = parseInt(n.slice(0, 2), 16) / 255;
	const g = parseInt(n.slice(2, 4), 16) / 255;
	const bl = parseInt(n.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, bl);
	const d = max - Math.min(r, g, bl);
	let h = 0;
	if (d !== 0) {
		if (max === r) h = (g - bl) / d % 6;
		else if (max === g) h = (bl - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	const s = max === 0 ? 0 : d / max * 100;
	return {
		h,
		s,
		b: max * 100
	};
}
function hsbToHex(h, s, b) {
	const sat = Math.max(0, Math.min(100, s)) / 100;
	const br = Math.max(0, Math.min(100, b)) / 100;
	const hue = (h % 360 + 360) % 360;
	const c = br * sat;
	const x = c * (1 - Math.abs(hue / 60 % 2 - 1));
	const m = br - c;
	let r = 0, g = 0, bl = 0;
	if (hue < 60) [r, g, bl] = [
		c,
		x,
		0
	];
	else if (hue < 120) [r, g, bl] = [
		x,
		c,
		0
	];
	else if (hue < 180) [r, g, bl] = [
		0,
		c,
		x
	];
	else if (hue < 240) [r, g, bl] = [
		0,
		x,
		c
	];
	else if (hue < 300) [r, g, bl] = [
		x,
		0,
		c
	];
	else [r, g, bl] = [
		c,
		0,
		x
	];
	const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
	return `#${to(r)}${to(g)}${to(bl)}`;
}
function shade(hex, mul) {
	const n = hex.replace("#", "");
	if (n.length < 6) return hex;
	const ch = (i) => Math.round(Math.max(0, Math.min(255, parseInt(n.slice(i, i + 2), 16) * mul))).toString(16).padStart(2, "0");
	return `#${ch(0)}${ch(2)}${ch(4)}`;
}
function getPalette(family, paint, visorPaint = false, light = null, paint2 = null) {
	const rec = getRecipe(family);
	const lightHex = light ?? "#79d7ff";
	const key = `${rec.id}:${paint ?? "kit"}:${paint2 ?? "kit2"}:${lightHex}:${visorPaint ? "v" : "b"}`;
	const hit = shared.get(key);
	if (hit) return hit;
	const hex = rec.palette;
	const prim = paint ?? hex.prim;
	const sec = paint2 ?? hex.sec;
	const acc = paint2 ?? hex.acc;
	const trim = paint2 ?? hex.trim;
	const dark = paint2 ? shade(paint2, .32) : "#2a2c31";
	const metal = paint2 ?? "#8b919a";
	const joint = paint2 ? shade(paint2, .42) : "#3d4048";
	const visorHex = visorPaint && paint ? paint : lightHex;
	const pal = {
		prim: std(prim),
		sec: std(sec, {
			metalness: .35,
			roughness: .4
		}),
		acc: std(acc, {
			metalness: .32,
			roughness: .42
		}),
		trim: std(trim, {
			metalness: .45,
			roughness: .35
		}),
		dark: std(dark, {
			metalness: .5,
			roughness: .4
		}),
		metal: std(metal, {
			metalness: .78,
			roughness: .28
		}),
		visor: std(visorHex, {
			metalness: .92,
			roughness: .08,
			envMapIntensity: 1.4,
			emissive: visorHex,
			emissiveIntensity: .55
		}),
		glow: std(lightHex, {
			metalness: .15,
			roughness: .22,
			envMapIntensity: .6,
			emissive: lightHex,
			emissiveIntensity: .85
		}),
		joint: std(joint, {
			metalness: .62,
			roughness: .32
		})
	};
	for (const m of Object.values(pal)) m.side = 2;
	shared.set(key, pal);
	return pal;
}
function explodeDir(socket) {
	const [x, y, z] = socket;
	const cy = 1.1;
	const dx = x;
	const dy = y - cy;
	const dz = z;
	const len = Math.hypot(dx, dy, dz) || 1;
	return [
		dx / len,
		dy / len,
		dz / len
	];
}
var B = (m, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => ({
	t: "box",
	m,
	s: [
		w,
		h,
		d
	],
	p: [
		x,
		y,
		z
	],
	r: rx || ry || rz ? [
		rx,
		ry,
		rz
	] : void 0
});
var C = (m, rt, rb, h, x, y, z, rx = 0, ry = 0, rz = 0, n) => ({
	t: "cyl",
	m,
	s: [
		rt,
		rb,
		h
	],
	p: [
		x,
		y,
		z
	],
	r: rx || ry || rz ? [
		rx,
		ry,
		rz
	] : void 0,
	n
});
var Sp = (m, r, x, y, z, n) => ({
	t: "sph",
	m,
	s: [
		r,
		r,
		r
	],
	p: [
		x,
		y,
		z
	],
	n
});
var N = (m, rt, rb, h, x, y, z, rx = 0, ry = 0, rz = 0) => ({
	t: "cone",
	m,
	s: [
		rt,
		rb,
		h
	],
	p: [
		x,
		y,
		z
	],
	r: rx || ry || rz ? [
		rx,
		ry,
		rz
	] : void 0
});
function base(slot) {
	return slot.replace(/[LR]$/, "");
}
function nSeg(r, extra = 0) {
	if (r.quad === "SS") return Math.min(8, Math.max(4, r.segs + extra));
	return Math.max(8, r.segs + extra);
}
function layersFor(r) {
	return 2 + Math.floor((r.density - 1) / 3);
}
function poly(r, m, rt, rb, h, x, y, z, sides, rx = 0, ry = 0, rz = 0) {
	return C(m, rt, rb, h, x, y, z, rx, ry, rz, sides ?? nSeg(r));
}
function mass(r, m, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
	if (r.quad === "SS") return B(m, w, h, d, x, y, z, rx, ry, rz);
	if (r.quad === "SR") return B(m, w, h, d, x, y, z, rx, ry, rz);
	if (r.quad === "RR") {
		if (Math.abs(w - h) < .08 && Math.abs(h - d) < .08) return Sp(m, Math.max(w, h, d) * .5, x, y, z, r.segs);
		const rad = Math.min(w, d) * .5;
		return C(m, rad, rad * .92, h, x, y, z, rx, ry, rz, r.segs);
	}
	const rad = Math.min(w, d) * .48;
	return C(m, rad, rad * .88, h, x, y, z, rx, ry, rz, r.segs);
}
function densitySeams(r, w, h, d, zf) {
	if (r.ornate) return [];
	const n = Math.floor((r.density - 1) / 3);
	const out = [];
	for (let i = 0; i < n; i++) {
		const y = -h * .28 + i * (h * .26);
		out.push(B("dark", w * .72, Math.max(.008, h * .04), Math.max(.01, d * .1), 0, y, zf));
	}
	if (r.density >= 8) out.push(B("dark", Math.max(.01, w * .04), h * .62, d * .08, 0, 0, zf * .8));
	return out;
}
function rsNubs(r, pts) {
	if (r.quad !== "RS") return [];
	return pts.map(([x, y, z, h]) => N("acc", .006, .016, h ?? .07, x, y, z));
}
var P2_MATS = /* @__PURE__ */ new Set([
	"sec",
	"acc",
	"trim",
	"dark",
	"metal",
	"joint"
]);
function flipX(s) {
	const r = s.r ? [
		s.r[0],
		-s.r[1],
		-s.r[2]
	] : void 0;
	return {
		...s,
		p: [
			-s.p[0],
			s.p[1],
			s.p[2]
		],
		r
	};
}
function ensureLR(specs, eps = .012) {
	const out = [...specs];
	for (const s of specs) {
		if (!P2_MATS.has(s.m)) continue;
		if (Math.abs(s.p[0]) < eps) continue;
		if (!specs.some((o) => o.m === s.m && o.t === s.t && Math.abs(o.p[0] + s.p[0]) < .02 && Math.abs(o.p[1] - s.p[1]) < .02 && Math.abs(o.p[2] - s.p[2]) < .02)) out.push(flipX(s));
	}
	return out;
}
function primBounds(specs) {
	const src = specs.filter((s) => s.m === "prim");
	const use = src.length ? src : specs;
	let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
	for (const s of use) {
		let hx;
		let hy;
		let hz;
		if (s.t === "box") {
			hx = s.s[0] / 2;
			hy = s.s[1] / 2;
			hz = s.s[2] / 2;
		} else if (s.t === "cyl" || s.t === "cone" || s.t === "capsule") {
			const rad = Math.max(s.s[0], s.s[1] || 0);
			const hh = (s.s[2] || .08) / 2;
			const rx = s.r?.[0] ?? 0;
			if (Math.abs(Math.abs(rx) - Math.PI / 2) < .3) {
				hx = rad;
				hy = rad;
				hz = hh;
			} else {
				hx = rad;
				hy = hh;
				hz = rad;
			}
		} else hx = hy = hz = s.s[0] || .05;
		minX = Math.min(minX, s.p[0] - hx);
		maxX = Math.max(maxX, s.p[0] + hx);
		minY = Math.min(minY, s.p[1] - hy);
		maxY = Math.max(maxY, s.p[1] + hy);
		minZ = Math.min(minZ, s.p[2] - hz);
		maxZ = Math.max(maxZ, s.p[2] + hz);
	}
	if (!Number.isFinite(minX)) return {
		cx: 0,
		cy: 0,
		cz: 0,
		w: .12,
		h: .12,
		d: .12,
		minY: -.06,
		maxY: .06
	};
	return {
		cx: (minX + maxX) / 2,
		cy: (minY + maxY) / 2,
		cz: (minZ + maxZ) / 2,
		w: Math.max(.04, maxX - minX),
		h: Math.max(.04, maxY - minY),
		d: Math.max(.04, maxZ - minZ),
		minY,
		maxY
	};
}
function slotSalt(id) {
	const b = base(id);
	let n = 0;
	for (let i = 0; i < b.length; i++) n = n * 33 + b.charCodeAt(i) | 0;
	return Math.abs(n);
}
function dressPart2(prim, r, slotId) {
	if (!prim.length) return [];
	const { cy, cz, w, h, d, minY } = primBounds(prim);
	const q = r.quad === "SS" ? 0 : r.quad === "SR" ? 1 : r.quad === "RS" ? 2 : 3;
	const segs = r.segs;
	const x = Math.max(.028, w * .38);
	const zf = cz + d * .42;
	const yt = cy + h * .32;
	const yb = cy - h * .28;
	const sx = Math.min(w, .3);
	const sy = Math.min(h, .3);
	const sz = Math.min(d, .24);
	if (!r.ornate) {
		const n = Math.floor((r.density - 1) / 4);
		if (n <= 0) return [];
		const out = [];
		for (let i = 0; i < n; i++) {
			const yy = minY + h * (.3 + i * .22 + r.rank % 5 * .012);
			out.push(B("dark", w * .62, Math.max(.008, h * .04), Math.max(.01, d * .1), 0, yy, zf * .15));
		}
		return out;
	}
	const motif = (r.code.serial * 19 + slotSalt(slotId) * 13 + r.density * 7 + q * 3) % 25;
	const out = [];
	switch (motif) {
		case 0:
			out.push(B("sec", Math.max(.016, sx * .12), sy * .72, sz * .34, x, cy, cz + d * .1));
			break;
		case 1: {
			const s = Math.max(.016, sx * .13);
			out.push(B("metal", s, s, s, x * .85, yt, zf * .45));
			break;
		}
		case 2: {
			const rad = Math.max(.011, sx * .1);
			out.push(C("dark", rad, rad * .72, sz * .42, x, cy, zf, Math.PI / 2, 0, 0, segs));
			break;
		}
		case 3:
			out.push(B("trim", sx * .22, sy * .12, sz * .48, x * .55, yt, zf * .25, 0, 0, .45));
			break;
		case 4:
			out.push(B("acc", Math.max(.014, w * .08), sy * .48, sz * .18, 0, cy, zf));
			break;
		case 5:
			if (q >= 2) out.push({
				t: "torus",
				m: "trim",
				s: [
					Math.max(.035, sx * .32),
					Math.max(.007, sx * .055),
					0
				],
				p: [
					0,
					yt,
					cz
				],
				r: [
					Math.PI / 2,
					0,
					0
				]
			});
			else out.push(B("trim", w * .52, Math.max(.012, h * .08), d * .18, 0, yt, zf * .15));
			break;
		case 6:
			out.push(B("sec", sx * .2, sy * .34, sz * .52, x, cy + h * .06, cz - d * .36, .35, .22, 0));
			break;
		case 7:
			out.push(N("acc", .005, Math.max(.012, sx * .1), Math.max(.036, sy * .32), x, yt, cz));
			break;
		case 8:
			out.push(B("dark", Math.max(.01, w * .045), sy * .78, sz * .62, x * .5, cy, cz));
			break;
		case 9:
			out.push(Sp(q >= 2 ? "sec" : "metal", Math.max(.014, sx * .11), x, cy, zf * .12, segs));
			break;
		case 10:
			out.push(B("metal", sx * .18, Math.max(.012, h * .075), sz * .38, x, yt, cz));
			break;
		case 11:
			out.push(B("acc", sx * .16, sy * .12, Math.max(.018, d * .13), x, cy, zf));
			break;
		case 12:
			if (q === 0) out.push({
				t: "tetra",
				m: "acc",
				s: [
					Math.max(.018, sx * .15),
					0,
					0
				],
				p: [
					x,
					yt,
					cz
				]
			});
			else out.push({
				t: "octa",
				m: "trim",
				s: [
					Math.max(.016, sx * .13),
					0,
					0
				],
				p: [
					x,
					yt,
					cz
				]
			});
			break;
		case 13:
			out.push(C("metal", Math.max(.007, sx * .055), Math.max(.007, sx * .055), sy * .68, x, cy, cz - d * .36, 0, 0, 0, segs));
			break;
		case 14:
			out.push(B("sec", w * .6, Math.max(.011, h * .09), d * .16, 0, yt, zf * .22));
			break;
		case 15:
			out.push(N("acc", .008, .02, sy * .4, x, yt, zf * .2, .4, 0, .2));
			break;
		case 16:
			out.push(B("trim", sx * .1, sy * .6, sz * .12, x, cy, cz, 0, 0, .7));
			break;
		case 17:
			out.push(C("glow", .012, .016, sz * .3, 0, cy, zf, Math.PI / 2, 0, 0, segs));
			break;
		case 18:
			out.push(B("sec", sx * .28, sy * .16, sz * .4, 0, yb, zf * .1));
			break;
		case 19:
			out.push({
				t: "octa",
				m: "metal",
				s: [
					Math.max(.014, sx * .12),
					0,
					0
				],
				p: [
					x,
					yb,
					cz
				]
			});
			break;
		case 20:
			out.push(B("dark", w * .4, h * .06, d * .2, 0, yt, cz));
			out.push(B("acc", sx * .1, sy * .2, sz * .12, x, cy, zf));
			break;
		case 21:
			out.push(C("joint", .012, .012, sy * .5, x, cy, cz, 0, 0, Math.PI / 2, segs));
			break;
		case 22:
			out.push(B("trim", sx * .18, sy * .08, sz * .5, x * .4, yt, cz, .2, 0, 0));
			break;
		case 23:
			out.push(N("metal", .006, .018, sy * .28, 0, yt, zf * .3));
			break;
		default: out.push(B("sec", sx * .26, sy * .42, Math.max(.018, d * .15), x, cy, zf * .32, 0, .18, 0));
	}
	return out;
}
function helmOrnament(r, W, H, D) {
	const i = r.rank - 12;
	const s = r.segs;
	const q = r.quad;
	switch (i) {
		case 0: return [B("sec", W * .95, .05, D * .35, 0, H * .48, .02), B("trim", W * .3, .04, D * .5, 0, H * .52, -.02)];
		case 1: return q === "RR" ? [Sp("acc", .03, .08, H * .42, .04, s), Sp("acc", .03, -.08, H * .42, .04, s)] : [B("acc", .04, .08, .05, .07, H * .44, .04, .4, 0, .2), B("acc", .04, .08, .05, -.07, H * .44, .04, .4, 0, -.2)];
		case 2: return [N("metal", .01, .03, .1, 0, -H * .15, D * .4, Math.PI / 2, 0, 0)];
		case 3: return [{
			t: "torus",
			m: "trim",
			s: [
				.12,
				.016,
				0
			],
			p: [
				0,
				H * .2,
				D * .05
			],
			r: [
				Math.PI / 2,
				0,
				0
			]
		}];
		case 4: return [B("metal", W * .7, .04, D * .55, 0, .02, D * .22, .45, 0, 0)];
		case 5: return [B("trim", .05, .18, .05, .1, H * .2, -.04), B("trim", .05, .18, .05, -.1, H * .2, -.04)];
		case 6: return [B("acc", W * .55, .03, .04, 0, H * .08, D * .32), B("dark", W * .4, .08, .03, 0, -.04, D * .28)];
		case 7: return q === "SS" ? [B("trim", W * .55, .03, W * .55, 0, H * .42, 0)] : [{
			t: "torus",
			m: "trim",
			s: [
				.13,
				.016,
				0
			],
			p: [
				0,
				H * .4,
				0
			],
			r: [
				Math.PI / 2,
				0,
				0
			]
		}];
		case 8: return [C("metal", .025, .02, .14, .14, .02, D * .15, Math.PI / 2, .4, 0, s), C("metal", .025, .02, .14, -.14, .02, D * .15, Math.PI / 2, -.4, 0, s)];
		case 9: return [B("acc", .04, .16, .1, 0, H * .5, -.02), B("trim", .08, .04, .08, 0, H * .6, -.02)];
		case 10: return [
			B("sec", .06, .06, .06, .12, H * .1, .08),
			B("sec", .06, .06, .06, -.12, H * .1, .08),
			B("sec", .05, .05, .05, 0, H * .28, .1)
		];
		case 11: return [B("prim", .05, .1, .22, .16, .04, -.08, .2, .7, 0), B("prim", .05, .1, .22, -.16, .04, -.08, .2, -.7, 0)];
		default: return [
			B("metal", .04, .04, .12, .1, H * .2, 0),
			B("metal", .04, .04, .12, -.1, H * .2, 0),
			C("glow", .02, .02, .05, 0, H * .3, D * .2, Math.PI / 2, 0, 0, s)
		];
	}
}
function helm(r) {
	const k = r.head;
	const W = .4 * k;
	const H = .28 * k;
	const D = .36 * k;
	const s = nSeg(r);
	const layers = layersFor(r);
	const out = [];
	const stack = (n, taper, tilt, y0, sides) => {
		const hh = H * 1.08 / n;
		for (let i = 0; i < n; i++) {
			const t = n === 1 ? 0 : i / (n - 1);
			const w = W * (1 - t * taper);
			const d = D * (1 - t * taper * .5);
			const y = y0 + H * .38 - t * H * .92;
			const z = t * tilt;
			if (sides) out.push(poly(r, "prim", w * .5, w * .42, hh * 1.06, 0, y, z, sides));
			else out.push(mass(r, "prim", w, hh * 1.08, d, 0, y, z));
		}
	};
	switch (r.helm) {
		case "blunt":
			stack(Math.min(3, layers), .14, .015, .02);
			out.push(mass(r, "sec", W * .62, H * .12, D * .2, 0, -H * .32, D * .08));
			break;
		case "hex":
			for (let i = 0; i < Math.min(4, layers); i++) {
				const t = i / Math.max(1, layers - 1);
				out.push(poly(r, "prim", W * (.46 - t * .12), W * (.4 - t * .1), H * .38, 0, H * .28 - t * H * .85, t * .02, 6));
			}
			out.push(mass(r, "sec", W * .48, H * .14, D * .28, 0, -H * .4, .02));
			break;
		case "wedge":
			out.push(mass(r, "prim", W * .78, H * 1.08, D * 1.08, 0, .02, .05, .42, 0, 0));
			out.push(B("sec", W * .9, H * .12, D * .22, 0, H * .34, -.04));
			if (r.density > 4) out.push(B("dark", W * .48, H * .07, D * .36, 0, .02, D * .3, .25, 0, 0));
			break;
		case "bucket":
			out.push(poly(r, "prim", W * .42, W * .34, H * 1.22, 0, 0, 0, r.quad === "SS" ? Math.min(8, s) : s));
			out.push(poly(r, "dark", W * .28, W * .26, H * .26, 0, -H * .42, .05, s));
			if (r.density > 5) out.push(B("sec", W * .7, H * .08, D * .18, 0, H * .2, D * .18));
			break;
		case "shelf":
			stack(layers, .26, .01, 0);
			out.push(B("sec", W * 1.08, H * .1, D * .58, 0, H * .24, D * .16));
			out.push(B("dark", W * .72, H * .07, D * .18, 0, H * .1, D * .24));
			break;
		case "diamond":
			out.push(mass(r, "prim", W * .52, H * .52, D * .52, 0, H * .3, 0, 0, Math.PI / 4, 0));
			out.push(mass(r, "prim", W * .78, H * .52, D * .72, 0, -H * .14, .02));
			if (r.density > 5) out.push(B("sec", W * .36, H * .08, D * .16, 0, H * .5, 0));
			break;
		case "split":
			out.push(mass(r, "prim", W * .38, H * 1.1, D * .92, .15, .04, 0));
			out.push(mass(r, "prim", W * .38, H * 1.1, D * .92, -.15, .04, 0));
			out.push(B("dark", W * .18, H * .5, D * .36, 0, -.04, .04));
			if (r.density > 6) {
				out.push(B("sec", W * .2, H * .1, D * .4, .15, H * .4, .04));
				out.push(B("sec", W * .2, H * .1, D * .4, -.15, H * .4, .04));
			}
			break;
		case "trap":
			stack(Math.max(4, layers), .5, .045, .08);
			out.push(mass(r, "sec", W * .55, H * .16, D * .7, 0, -H * .36, .02));
			break;
		case "snout":
			out.push(mass(r, "prim", W * .84, H * .95, D * .68, 0, .06, -.05));
			out.push(mass(r, "prim", W * .4, H * .42, D * .72, 0, -.06, D * .4));
			if (r.density > 5) out.push(B("dark", W * .26, H * .1, D * .2, 0, -.1, D * .55));
			break;
		case "hood":
			out.push(mass(r, "prim", W * .92, H * .68, D * .5, 0, .08, .08));
			out.push(mass(r, "sec", W * .72, H * .5, D * .9, 0, .14, -.1));
			out.push(B("dark", W * .55, H * .18, D * .18, 0, -.1, D * .16));
			break;
		case "step": {
			const n = Math.min(6, 2 + Math.ceil(r.density / 2));
			for (let i = 0; i < n; i++) {
				const t = i / n;
				out.push(mass(r, i % 2 ? "sec" : "prim", W * (1 - t * .42), H / n + .018, D * (1 - t * .22), 0, H * .42 - t * H, t * .025));
			}
			break;
		}
		case "gem":
			out.push({
				t: "octa",
				m: "prim",
				s: [
					Math.max(W, D) * .4,
					0,
					0
				],
				p: [
					0,
					H * .22,
					0
				]
			});
			out.push(mass(r, "prim", W * .64, H * .42, D * .58, 0, -H * .24, .02));
			if (r.density > 7) {
				out.push(B("trim", W * .18, H * .07, D * .18, .1, 0, .08, 0, 0, .4));
				out.push(B("trim", W * .18, H * .07, D * .18, -.1, 0, .08, 0, 0, -.4));
			}
			break;
		case "anvil":
			out.push(mass(r, "prim", W * 1.12, H * .22, D * .7, 0, H * .38, 0));
			out.push(mass(r, "prim", W * .55, H * .55, D * .55, 0, .02, .02));
			out.push(mass(r, "sec", W * .85, H * .2, D * .6, 0, -H * .32, .04));
			break;
		case "arrow":
			out.push(mass(r, "prim", W * .7, H * .7, D * .7, 0, -.04, 0));
			out.push(B("acc", W * .22, H * .55, D * .18, .1, H * .28, .02, 0, 0, .55));
			out.push(B("acc", W * .22, H * .55, D * .18, -.1, H * .28, .02, 0, 0, -.55));
			out.push(B("sec", W * .18, H * .12, D * .2, 0, H * .48, .02));
			break;
		case "beak":
			out.push(mass(r, "prim", W * .8, H * .75, D * .65, 0, .08, -.04));
			out.push(N("prim", .02, W * .28, H * .7, 0, -.08, D * .28, Math.PI / 2, 0, 0));
			out.push(B("dark", W * .3, H * .1, D * .16, 0, -.06, D * .42));
			break;
		case "clam":
			out.push(mass(r, "prim", W * .95, H * .42, D * .8, 0, H * .18, .02, -.18, 0, 0));
			out.push(mass(r, "prim", W * .85, H * .4, D * .7, 0, -H * .18, .04, .22, 0, 0));
			out.push(B("dark", W * .5, H * .08, D * .2, 0, 0, D * .28));
			break;
		case "plow":
			out.push(mass(r, "prim", W * .7, H * .9, D * .55, 0, .04, -.06));
			out.push(B("sec", W * 1.05, H * .55, D * .22, 0, .02, D * .28, .5, 0, 0));
			out.push(B("dark", W * .4, H * .12, D * .16, 0, -H * .2, D * .35));
			break;
		case "tower":
			stack(Math.max(4, layers), .22, .01, .12);
			out.push(mass(r, "sec", W * .9, H * .16, D * .7, 0, H * .52, 0));
			out.push(mass(r, "prim", W * .5, H * .22, D * .5, 0, -H * .4, .04));
			break;
		case "mask":
			out.push(mass(r, "prim", W * .7, H * .85, D * .45, 0, .04, -.08));
			out.push(B("sec", W * .95, H * .95, D * .14, 0, .02, D * .22));
			out.push(B("dark", W * .55, H * .12, D * .08, 0, -H * .28, D * .28));
			break;
		case "cap":
			if (r.quad === "SS") out.push(poly(r, "prim", W * .45, W * .4, H * .7, 0, H * .15, 0, 8));
			else out.push(Sp("prim", W * .42, 0, H * .12, 0, s));
			out.push(mass(r, "sec", W * .85, H * .18, D * .7, 0, -H * .22, .04));
			out.push(C("dark", W * .3, W * .3, H * .12, 0, -H * .08, D * .2, Math.PI / 2, 0, 0, s));
			break;
		case "ram":
			out.push(mass(r, "prim", W * .78, H * .85, D * .7, 0, .04, 0));
			out.push(C("sec", .05, .035, .22, .18, .02, D * .18, Math.PI / 2, .45, 0, s));
			out.push(C("sec", .05, .035, .22, -.18, .02, D * .18, Math.PI / 2, -.45, 0, s));
			if (r.quad === "RS") {
				out.push(N("acc", .008, .028, .1, .18, .02, D * .32, Math.PI / 2, .45, 0));
				out.push(N("acc", .008, .028, .1, -.18, .02, D * .32, Math.PI / 2, -.45, 0));
			}
			break;
		case "ridge":
			stack(layers, .2, .02, 0);
			out.push(B("trim", .06, H * 1.15, D * .45, 0, H * .2, -.02));
			out.push(B("acc", .04, H * .3, D * .12, 0, H * .55, .02));
			break;
		case "facet": {
			const n = 2 + Math.floor(r.density / 4);
			const cell = W / n;
			for (let ix = 0; ix < n; ix++) for (let iy = 0; iy < n; iy++) {
				const px = (ix - (n - 1) / 2) * cell * .85;
				const py = (iy - (n - 1) / 2) * (H / n) * 1.4;
				out.push(mass(r, (ix + iy) % 2 ? "sec" : "prim", cell * .78, H / n * 1.1, D * (.55 + iy * .08), px, py, iy * .015));
			}
			break;
		}
		case "hawk":
			out.push(mass(r, "prim", W * .7, H * .85, D * .6, 0, .04, .04));
			out.push(B("sec", .08, H * .45, D * .7, .18, .08, -.12, .15, .55, 0));
			out.push(B("sec", .08, H * .45, D * .7, -.18, .08, -.12, .15, -.55, 0));
			out.push(B("dark", W * .4, H * .1, D * .2, 0, -H * .28, D * .2));
			break;
		case "cage":
			out.push(mass(r, "dark", W * .55, H * .7, D * .5, 0, 0, 0));
			out.push(B("metal", W * .9, .04, D * .7, 0, H * .38, 0));
			out.push(B("metal", W * .9, .04, D * .7, 0, -H * .32, 0));
			out.push(B("metal", .04, H, D * .7, .18, 0, 0));
			out.push(B("metal", .04, H, D * .7, -.18, 0, 0));
			out.push(B("metal", .04, H * .7, D * .04, 0, 0, D * .35));
			break;
		default: stack(layers, .28, .03, 0);
	}
	out.push(...densitySeams(r, W, H, D, D * .32));
	if (r.ornate) out.push(...helmOrnament(r, W, H, D));
	out.push(...rsNubs(r, r.ornate ? [[
		.12,
		H * .3,
		D * .1,
		.08
	], [
		-.12,
		H * .3,
		D * .1,
		.08
	]] : []));
	return out;
}
function brow(r) {
	const w = .24 * r.head;
	if (r.helm === "shelf") return [B("prim", w * 1.35, .035, .12, 0, .01, .04)];
	if (r.helm === "mask") return [B("sec", w * 1.2, .03, .06, 0, .02, .02)];
	if (r.quad === "RR") return [C("prim", w * .5, w * .5, .035, 0, 0, 0, Math.PI / 2, 0, 0, r.segs)];
	return [B("prim", w, .035, .07, 0, 0, 0), B("dark", w * .85, .014, .03, 0, -.016, .02)];
}
function eye(r) {
	if (r.visor === "mono" || r.visor === "dome" || r.visor === "visorGem") return [Sp("visor", .038 * r.head, 0, 0, .01, r.segs), B("glow", .02, .02, .016, 0, 0, .025)];
	if (r.quad === "SS") return [B("visor", .055, .03, .026, 0, 0, 0), B("dark", .06, .01, .018, 0, .018, 0)];
	if (r.quad === "RR") return [Sp("visor", .028, 0, 0, .01, r.segs)];
	return [B("visor", .05, .036, .026, 0, 0, 0), Sp("glow", .01, 0, 0, .018, r.segs)];
}
function nose(r) {
	if (r.helm === "snout") return [mass(r, "prim", .07, .05, .12, 0, 0, .04), B("dark", .04, .025, .05, 0, -.01, .08)];
	if (r.helm === "beak") return [N("prim", .01, .035, .09, 0, -.01, .03, Math.PI / 2, 0, 0)];
	if (r.helm === "arrow") return [B("acc", .035, .045, .05, 0, 0, .02, .25, 0, 0)];
	if (r.quad === "RR") return [Sp("prim", .032, 0, 0, .016, r.segs)];
	return [B("prim", .04, .035, .055, 0, 0, .018)];
}
function mouth(r) {
	if (r.helm === "beak" || r.helm === "snout") return [B("dark", .07 * r.head, .02, .04, 0, 0, .02)];
	return [B("dark", .1 * r.head, .022, .035, 0, 0, 0), B("prim", .12 * r.head, .035, .045, 0, -.028, -.01)];
}
function jaw(r) {
	if (r.helm === "trap" || r.helm === "wedge") return [mass(r, "prim", .16 * r.head, .07, .16, 0, 0, .02), B("dark", .08, .03, .08, 0, -.02, .06)];
	if (r.quad === "SS") return [B("prim", .2 * r.head, .075, .13, 0, 0, 0)];
	return [mass(r, "prim", .2 * r.head, .075, .13, 0, 0, 0)];
}
function ear(r) {
	if (r.helm === "hawk") return [B("prim", .04, .12, .16, 0, .02, -.04, .2, .4, 0)];
	if (r.quad === "RR") return [Sp("prim", .045, 0, 0, 0, r.segs), C("dark", .018, .018, .035, 0, 0, .028, Math.PI / 2, 0, 0, r.segs)];
	if (r.quad === "RS" && r.ornate) return [B("prim", .045, .1, .07, 0, 0, 0), N("acc", .006, .02, .08, .02, .06, 0)];
	return [B("prim", .045, .09, .07, 0, 0, 0), C("dark", .016, .016, .035, 0, .02, .028, Math.PI / 2, 0, 0, r.segs)];
}
function visor(r) {
	const w = r.head;
	const s = r.segs;
	switch (r.visor) {
		case "mono": return r.quad === "SS" ? [B("visor", .12 * w, .09 * w, .045, 0, 0, .02), B("glow", .04, .04, .025, 0, 0, .045)] : [Sp("visor", .065 * w, 0, 0, .02, s), B("glow", .035, .035, .025, 0, 0, .045)];
		case "dual": return [B("visor", .065 * w, .065 * w, .035, -.08, 0, 0), B("visor", .065 * w, .065 * w, .035, .08, 0, 0)];
		case "bar": return [B("visor", .32 * w, .04, .035, 0, 0, 0), B("dark", .34 * w, .014, .045, 0, .032, 0)];
		case "thin": return [B("visor", .26 * w, .024, .028, 0, .01, 0)];
		case "recess": return [B("dark", .2 * w, .055, .028, 0, 0, 0), B("visor", .11 * w, .026, .018, 0, 0, .01)];
		case "tee": return [B("visor", .28 * w, .03, .03, 0, .02, 0), B("visor", .045, .09 * w, .03, 0, -.03, 0)];
		case "notch": return [B("visor", .22 * w, .045, .03, 0, 0, 0), B("dark", .05, .06, .02, 0, -.02, .01)];
		case "plus": return [B("visor", .2 * w, .028, .03, 0, 0, 0), B("visor", .028, .12 * w, .03, 0, 0, 0)];
		case "window": return [
			B("dark", .24 * w, .1 * w, .025, 0, 0, 0),
			B("visor", .09 * w, .07 * w, .02, -.05, 0, .01),
			B("visor", .09 * w, .07 * w, .02, .05, 0, .01)
		];
		case "penta": return [C("visor", .09 * w, .09 * w, .04, 0, 0, 0, Math.PI / 2, 0, 0, 5)];
		case "strip": return [B("visor", .3 * w, .02, .025, 0, .02, 0), B("visor", .3 * w, .02, .025, 0, -.02, 0)];
		case "dome": return [C("visor", .1 * w, .1 * w, .05, 0, 0, 0, Math.PI / 2, 0, 0, s)];
		case "visorV": return [B("visor", .12 * w, .05, .03, .06, 0, 0, 0, 0, .5), B("visor", .12 * w, .05, .03, -.06, 0, 0, 0, 0, -.5)];
		case "visorX": return [B("visor", .18 * w, .03, .03, 0, 0, 0, 0, 0, .7), B("visor", .18 * w, .03, .03, 0, 0, 0, 0, 0, -.7)];
		case "diamond": return [B("visor", .1 * w, .1 * w, .035, 0, 0, 0, 0, 0, Math.PI / 4)];
		case "visorHex": return [C("visor", .08 * w, .08 * w, .04, 0, 0, 0, Math.PI / 2, 0, 0, 6)];
		case "visorBar2": return [B("visor", .3 * w, .03, .03, 0, .025, 0), B("visor", .22 * w, .03, .03, 0, -.025, 0)];
		case "visorCrest": return [B("visor", .08 * w, .14 * w, .035, 0, .02, 0), B("glow", .03, .06, .02, 0, .04, .02)];
		case "visorSplit": return [
			B("visor", .1 * w, .07 * w, .03, -.07, .01, 0),
			B("visor", .1 * w, .07 * w, .03, .07, .01, 0),
			B("dark", .04, .08, .02, 0, 0, 0)
		];
		case "visorRing": return [{
			t: "torus",
			m: "visor",
			s: [
				.08 * w,
				.016,
				0
			],
			p: [
				0,
				0,
				.01
			],
			r: [
				Math.PI / 2,
				0,
				0
			]
		}];
		case "visorGem": return [{
			t: "octa",
			m: "visor",
			s: [
				.055 * w,
				0,
				0
			],
			p: [
				0,
				0,
				.02
			]
		}];
		case "visorMask": return [
			B("visor", .28 * w, .12 * w, .03, 0, 0, 0),
			B("dark", .06, .04, .02, -.06, .02, .015),
			B("dark", .06, .04, .02, .06, .02, .015)
		];
		case "visorArrow": return [
			B("visor", .08, .1 * w, .03, 0, .02, 0, 0, 0, 0),
			B("visor", .14 * w, .04, .03, .07, -.02, 0, 0, 0, .45),
			B("visor", .14 * w, .04, .03, -.07, -.02, 0, 0, 0, -.45)
		];
		case "visorWide": return [B("visor", .38 * w, .055, .04, 0, 0, 0), B("glow", .12, .02, .02, 0, 0, .02)];
		default: return [B("visor", .2 * w, .05, .03, 0, 0, 0)];
	}
}
function vfin(r) {
	if (!r.ornate || r.crest === "none") return [];
	switch (r.crest) {
		case "horn": return [N("acc", .014, .036, .15, .09, .05, 0), N("acc", .014, .036, .15, -.09, .05, 0)];
		case "halo": return r.quad === "SS" ? [B("trim", .2, .028, .2, 0, .1, 0)] : [C("trim", .14, .14, .028, 0, .1, 0, 0, 0, 0, r.segs)];
		case "mast": return [B("metal", .022, .22, .045, 0, .1, -.02), B("acc", .035, .035, .035, 0, .22, 0)];
		case "crown": return [
			B("trim", .18, .05, .06, 0, .08, 0),
			B("acc", .025, .1, .025, .06, .12, 0),
			B("acc", .025, .1, .025, -.06, .12, 0)
		];
		case "twin": return [B("prim", .025, .2, .12, .055, .08, 0, 0, 0, .4), B("prim", .025, .2, .12, -.055, .08, 0, 0, 0, -.4)];
		case "fin": return [B("trim", .028, .18, .1, 0, .12, -.02, .15, 0, 0)];
		case "ram": return [N("acc", .018, .04, .16, .1, .03, -.03, .85, .45, 0), N("acc", .018, .04, .16, -.1, .03, -.03, .85, -.45, 0)];
		case "wing": return [B("prim", .03, .1, .18, .12, .05, 0, .25, .55, 0), B("prim", .03, .1, .18, -.12, .05, 0, .25, -.55, 0)];
		case "teeth": return [
			B("acc", .025, .08, .025, .05, .1, .02),
			B("acc", .025, .1, .025, 0, .11, .02),
			B("acc", .025, .08, .025, -.05, .1, .02)
		];
		case "plow": return [B("prim", .13, .07, .14, 0, -.02, .07, .4, 0, 0)];
		case "cloak": return [B("sec", .18, .07, .12, 0, .02, -.08, -.3, 0, 0)];
		case "blade": return [B("metal", .02, .2, .08, 0, .12, .02, .1, 0, 0)];
		case "spike": return [N("acc", .01, .03, .14, 0, .12, 0)];
		default: return [];
	}
}
function antenna(r) {
	const s = r.segs;
	if (!r.ornate) {
		const k = r.rank % 4;
		if (k === 0) return [B("metal", .018, .08, .018, 0, .02, 0)];
		if (k === 1) return [C("metal", .01, .008, .1, 0, .04, 0, 0, 0, 0, s)];
		if (k === 2) return [B("metal", .014, .12, .02, 0, .04, 0, 0, 0, .2)];
		return [B("dark", .03, .04, .03, 0, .01, 0)];
	}
	const i = r.rank - 12;
	if (i === 0) return [C("metal", .012, .01, .2, 0, .08, 0, 0, 0, 0, s), Sp("acc", .02, 0, .18, 0, s)];
	if (i === 1) return [B("metal", .02, .18, .03, 0, .08, 0), B("acc", .03, .03, .03, 0, .18, 0)];
	if (i === 2) return [C("metal", .01, .01, .16, .03, .06, 0, 0, 0, .3, s)];
	if (i === 3) return [{
		t: "torus",
		m: "trim",
		s: [
			.04,
			.01,
			0
		],
		p: [
			0,
			.08,
			0
		]
	}];
	if (i === 4) return [N("metal", .006, .018, .14, 0, .08, 0)];
	if (i === 5) return [B("trim", .04, .14, .02, 0, .06, 0)];
	if (i === 6) return [C("metal", .014, .01, .12, 0, .05, 0, 0, 0, 0, s), B("visor", .03, .03, .03, 0, .12, 0)];
	if (i === 7) return [B("metal", .016, .1, .04, 0, .04, 0, .3, 0, 0)];
	if (i === 8) return [C("metal", .008, .008, .18, 0, .08, 0, .4, 0, 0, s)];
	if (i === 9) return [B("acc", .025, .16, .025, 0, .07, 0)];
	if (i === 10) return [Sp("metal", .025, 0, .06, 0, s), C("metal", .008, .008, .1, 0, .12, 0, 0, 0, 0, s)];
	if (i === 11) return [B("prim", .03, .12, .08, 0, .05, -.02, .2, .3, 0)];
	return [B("metal", .02, .14, .02, 0, .06, 0), C("glow", .012, .012, .04, 0, .14, 0, 0, 0, 0, s)];
}
function cheek(r) {
	if (r.helm === "trap" || r.helm === "anvil") return [B("prim", .1 * r.head, .14, .16, 0, 0, 0), B("acc", .035, .07, .16, .04, 0, .02)];
	if (r.helm === "split") return [mass(r, "prim", .07 * r.head, .14, .12, 0, .02, 0)];
	if (r.curve > .65) return [Sp("prim", .065 * r.head, 0, 0, 0, r.segs)];
	return [mass(r, "prim", .075 * r.head, .11, .13, 0, 0, 0), B("dark", .035, .07, .05, 0, 0, .055)];
}
function chin(r) {
	if (r.helm === "snout" || r.helm === "beak" || r.helm === "hood") return [B("prim", .13 * r.head, .07, .16, 0, 0, .04), B("dark", .07, .04, .09, 0, -.02, .09)];
	if (r.helm === "plow") return [B("prim", .16 * r.head, .06, .14, 0, 0, .05, .35, 0, 0)];
	return [mass(r, "prim", .17 * r.head, .07, .11, 0, 0, 0)];
}
function collar(r) {
	const w = .4 * r.shoulder;
	return [
		mass(r, "prim", w, .1 * r.torso, .28, 0, 0, 0),
		B("sec", w * .7, .06, .12, 0, .04, .1),
		C("joint", .07, .07, .08, 0, .06, 0, 0, 0, 0, r.segs)
	];
}
function chestCore(r) {
	const W = .44 * r.torso * (r.canon === "brute" || r.canon === "heavy" ? 1.15 : r.canon === "stalker" ? .82 : 1);
	const H = .36 * r.torso;
	const D = .28 * r.torso;
	const s = r.segs;
	const out = [];
	switch (r.chest) {
		case "plow":
			out.push(mass(r, "prim", W, H, D, 0, 0, 0), B("sec", W * .4, H * .55, .07, 0, .04, D * .48), B("dark", W * .28, .07, .07, 0, -.1, D * .38));
			break;
		case "wedge":
			out.push(mass(r, "prim", W * .85, H, D * 1.08, 0, 0, 0, .28, 0, 0), B("sec", .09, H * .75, D * .55, .18, 0, .04, 0, 0, .2), B("sec", .09, H * .75, D * .55, -.18, 0, .04, 0, 0, -.2));
			break;
		case "hex":
			out.push(poly(r, "prim", W * .42, W * .38, H, 0, 0, 0, 6), B("sec", W * .3, H * .2, D * .3, 0, .08, D * .3));
			break;
		case "rib":
			out.push(mass(r, "prim", W * .8, H, D * .82, 0, 0, 0));
			for (let i = 0; i < 2 + Math.floor(r.density / 4); i++) out.push(B("sec", W * .95, .035, D * .48, 0, -.1 + i * .07, D * .18));
			break;
		case "slim":
			out.push(mass(r, "prim", W * .68, H * 1.05, D * .72, 0, 0, 0), B("sec", .07, H * .65, D * .35, .13, 0, .05), B("sec", .07, H * .65, D * .35, -.13, 0, .05));
			break;
		case "bulk":
			out.push(mass(r, "prim", W * 1.15, H * 1.08, D * 1.08, 0, 0, 0), B("metal", W * 1.02, .05, D, 0, -H * .4, 0), B("acc", .09, .09, .07, 0, .06, D * .48));
			break;
		case "shield":
			out.push(mass(r, "prim", W * 1.05, H * 1.05, D * .68, 0, 0, .04), B("metal", W * .38, H * .48, .09, 0, .04, D * .42));
			break;
		case "cage":
			out.push(B("dark", W * .68, H * .82, D * .55, 0, 0, 0), B("metal", W, .035, D, 0, H * .4, 0), B("metal", W, .035, D, 0, -H * .35, 0), B("metal", .035, H, D, .18, 0, 0), B("metal", .035, H, D, -.18, 0, 0));
			break;
		case "core":
			out.push(mass(r, "prim", W * .9, H, D, 0, 0, 0), Sp("visor", .065, 0, .04, D * .42, s), B("sec", W * .28, H * .38, .07, 0, .02, D * .32));
			break;
		case "barrel":
			out.push(poly(r, "prim", W * .42, W * .4, H, 0, 0, 0), C("acc", .07, .07, .055, 0, .04, D * .42, Math.PI / 2, 0, 0, s));
			break;
		case "slab":
			out.push(B("prim", W * 1.08, H * .85, D * .55, 0, 0, .02), B("sec", W * .7, H * .12, D * .2, 0, H * .28, D * .2));
			break;
		case "peak":
			out.push(mass(r, "prim", W * .85, H * .7, D * .8, 0, -.04, 0), N("prim", .04, W * .42, H * .55, 0, H * .28, 0));
			break;
		case "fortress":
			out.push(mass(r, "prim", W, H, D, 0, 0, 0), B("sec", .1, H * .9, .1, W * .48, .04, .06), B("sec", .1, H * .9, .1, -W * .48, .04, .06), B("metal", W * .4, .06, D * .6, 0, H * .42, 0));
			break;
		case "reactor":
			out.push(mass(r, "prim", W * .9, H, D, 0, 0, 0), Sp("glow", .08, 0, .02, D * .4, s), C("trim", .12, .12, .03, 0, .02, D * .38, Math.PI / 2, 0, 0, s));
			break;
		case "grate":
			out.push(mass(r, "prim", W, H, D * .75, 0, 0, 0));
			for (let i = 0; i < 3 + Math.floor(r.density / 4); i++) out.push(B("dark", W * .7, .02, D * .4, 0, -H * .3 + i * .08, D * .28));
			break;
		case "crystal":
			out.push(mass(r, "prim", W * .75, H * .7, D * .7, 0, -.04, 0), {
				t: "octa",
				m: "acc",
				s: [
					.1,
					0,
					0
				],
				p: [
					0,
					H * .2,
					D * .25
				]
			});
			break;
		case "hump":
			out.push(mass(r, "prim", W * .8, H * .7, D * .7, 0, -.04, 0), Sp("prim", .12, .1, .08, .04, s), Sp("prim", .1, -.1, .06, .04, s));
			break;
		case "delta":
			out.push(C("prim", .04, W * .5, H * 1.05, 0, 0, 0, 0, 0, 0, 3), B("sec", W * .3, .06, D * .4, 0, -H * .3, D * .15));
			break;
		case "lattice":
			out.push(B("dark", W * .6, H * .7, D * .45, 0, 0, 0), B("metal", W, .04, .04, 0, H * .25, D * .2), B("metal", W, .04, .04, 0, -H * .2, D * .2), B("metal", .04, H, .04, .14, 0, D * .2), B("metal", .04, H, .04, -.14, 0, D * .2));
			break;
		case "boiler":
			out.push(C("prim", .1, .1, .28, .1, 0, 0, Math.PI / 2, 0, 0, s), C("prim", .1, .1, .28, -.1, 0, 0, Math.PI / 2, 0, 0, s), B("metal", W * .7, .08, D * .4, 0, .12, 0));
			break;
		case "armature":
			out.push(B("dark", W * .5, H * .6, D * .4, 0, 0, 0), C("joint", .05, .05, .12, .16, .08, 0, 0, 0, Math.PI / 2, s), C("joint", .05, .05, .12, -.16, .08, 0, 0, 0, Math.PI / 2, s), B("metal", .04, H * .8, .04, .1, 0, .08), B("metal", .04, H * .8, .04, -.1, 0, .08));
			break;
		case "altar": {
			const n = 2 + Math.floor(r.density / 4);
			for (let i = 0; i < n; i++) {
				const t = i / n;
				out.push(mass(r, i % 2 ? "sec" : "prim", W * (1 - t * .3), H / n + .02, D * (1 - t * .15), 0, H * .35 - t * H, t * .02));
			}
			break;
		}
		case "carapace":
			out.push(mass(r, "prim", W * 1.05, H * .5, D * .9, 0, H * .15, .04, -.2, 0, 0), mass(r, "sec", W * .9, H * .5, D * .75, 0, -H * .15, .02, .15, 0, 0));
			break;
		case "turbine":
			out.push(mass(r, "prim", W * .85, H, D * .7, 0, 0, 0), C("metal", .12, .12, .04, 0, .04, D * .35, Math.PI / 2, 0, 0, s), B("trim", .04, .16, .04, .08, .04, D * .38), B("trim", .04, .16, .04, -.08, .04, D * .38));
			break;
		case "wingbox":
			out.push(mass(r, "prim", W * .75, H, D, 0, 0, 0), B("sec", .16, .08, .28, .22, .06, -.04, .2, .4, 0), B("sec", .16, .08, .28, -.22, .06, -.04, .2, -.4, 0));
			break;
		default: out.push(mass(r, "prim", W, H, D, 0, 0, 0));
	}
	out.push(...densitySeams(r, W, H, D, D * .4));
	if (r.quad === "RS" && r.ornate) {
		out.push(N("acc", .008, .022, .1, W * .42, H * .2, .04));
		out.push(N("acc", .008, .022, .1, -W * .42, H * .2, .04));
	}
	return out;
}
function pec(r) {
	const w = .18 * r.torso;
	const out = [];
	if (r.chest === "bulk" || r.canon === "heavy") out.push(B("prim", w * 1.15, .26, .16, 0, 0, 0), B("metal", .07, .18, .18, .05, 0, .02));
	else if (r.curve > .6) out.push(Sp("prim", .09, 0, 0, 0, r.segs), C("dark", .045, .045, .07, 0, .04, .05, Math.PI / 2, 0, 0, r.segs));
	else out.push(mass(r, "prim", w, .22, .13, 0, 0, 0), B("sec", .1, .05, .07, 0, .05, .05));
	out.push(...densitySeams(r, w, .22, .13, .06));
	return out;
}
function cockpit(r) {
	if (r.chest === "core" || r.chest === "reactor" || r.visor === "mono") return [Sp("acc", .055, 0, 0, 0, r.segs)];
	if (r.curve > .5) return [C("acc", .055, .055, .035, 0, 0, 0, Math.PI / 2, 0, 0, r.segs)];
	return [B("acc", .09, .09, .045, 0, 0, 0), B("trim", .05, .05, .035, 0, 0, .018)];
}
function abdomen(r) {
	const h = r.canon === "runner" || r.canon === "stalker" ? .26 : r.canon === "brute" ? .16 : .22;
	const w = .32 * r.torso;
	return [
		mass(r, "prim", w, h * r.height, .2, 0, 0, 0),
		B("dark", .16, h * .45, .07, 0, 0, .09),
		C("joint", .045, .045, .09, .09, 0, 0, 0, 0, Math.PI / 2, r.segs),
		C("joint", .045, .045, .09, -.09, 0, 0, 0, 0, Math.PI / 2, r.segs),
		...densitySeams(r, w, h, .2, .1)
	];
}
function pelvis(r) {
	const w = .34 * r.hip;
	return [
		mass(r, "prim", w, .13, .22, 0, 0, 0),
		B("sec", .18, .07, .1, 0, -.02, .07),
		C("joint", .065, .065, .09, .11, -.04, 0, 0, 0, Math.PI / 2, r.segs),
		C("joint", .065, .065, .09, -.11, -.04, 0, 0, 0, Math.PI / 2, r.segs),
		...densitySeams(r, w, .13, .22, .1)
	];
}
function skirtF(r) {
	if (r.canon === "knight") return [B("prim", .26, .28, .08, 0, -.08, 0, .2, 0, 0), B("trim", .1, .16, .06, 0, -.06, .03)];
	if (r.chest === "slim") return [B("prim", .18, .2, .05, 0, -.05, 0, .35, 0, 0)];
	return [mass(r, "prim", .24 * r.hip, .18, .08, 0, -.04, 0, .15, 0, 0)];
}
function skirtB(r) {
	return [mass(r, "prim", .22 * r.hip, r.canon === "knight" ? .24 : .16, .08, 0, -.02, 0)];
}
function skirtS(r) {
	if (r.canon === "heavy") return [B("prim", .1, .24, .22, 0, -.06, 0), B("acc", .06, .16, .16, .04, -.04, 0)];
	return [mass(r, "prim", .08, .18, .18, 0, -.04, 0)];
}
function shoulder(r) {
	const s = r.shoulder;
	const t = r.thick;
	const sg = r.segs;
	switch (r.limb) {
		case "capsule": return [Sp("prim", .13 * t * s, 0, .04, 0, sg), B("sec", .15 * s, .07, .15, 0, .11, 0)];
		case "blade": return [B("prim", .15 * s, .13 * t, .22, .02, .04, 0), B("acc", .045, .18, .26, .08, .08, -.04, .5, 0, 0)];
		case "block": return [B("prim", .26 * s, .2 * t, .3, .04, .04, 0), B("metal", .11, .13, .32, .12, .08, 0)];
		case "frame": return [
			B("metal", .2 * s, .035, .22, .02, .1, 0),
			B("metal", .035, .15, .22, .1, .02, 0),
			B("metal", .035, .15, .22, -.06, .02, 0),
			B("dark", .11, .09, .11, 0, 0, 0)
		];
		case "pipe": return [C("prim", .12 * t, .14 * t, .17 * s, 0, .02, 0, 0, 0, Math.PI / 2, sg), B("acc", .09, .09, .18, .05, .1, 0)];
		case "plate": return [mass(r, "prim", .22 * s, .16 * t, .26, .03, .05, 0), B("sec", .09, .09, .2, .1, .12, 0)];
		case "slab": return [B("prim", .3 * s, .12 * t, .28, .02, .06, 0), B("dark", .2, .04, .2, .02, .01, .02)];
		case "beam": return [B("metal", .06, .2, .06, .04, .04, 0), B("prim", .18 * s, .1, .2, 0, .08, 0)];
		case "hinge": return [C("joint", .08 * t, .08 * t, .14, 0, .02, 0, 0, 0, Math.PI / 2, sg), B("prim", .16 * s, .1, .18, .04, .08, 0)];
		case "boxer": return [B("prim", .24 * s, .22 * t, .24, .03, .04, 0), B("sec", .08, .16, .08, .12, .06, .06)];
		case "post": return [C("prim", .08 * t, .08 * t, .2 * s, 0, .04, 0, 0, 0, 0, sg), B("metal", .12, .04, .12, 0, .14, 0)];
		case "rail": return [
			B("metal", .04, .18, .22, .08, .04, 0),
			B("metal", .04, .18, .22, -.04, .04, 0),
			B("prim", .16, .08, .16, .02, .1, 0)
		];
		case "brick": return [B("prim", .2 * s, .1, .2, .02, .08, 0), B("prim", .18 * s, .1, .18, .02, -.02, 0)];
		case "channel": return [
			B("prim", .22 * s, .16, .06, .02, .04, .08),
			B("prim", .22 * s, .16, .06, .02, .04, -.08),
			B("dark", .1, .1, .12, 0, 0, 0)
		];
		case "claw": return [mass(r, "prim", .18 * s, .16, .2, .02, .04, 0), N("acc", .01, .03, .12, .1, .1, .04, .5, 0, 0)];
		case "piston": return [C("metal", .05, .05, .18, .04, .04, 0, 0, 0, 0, sg), C("prim", .08, .07, .12, 0, .02, 0, 0, 0, Math.PI / 2, sg)];
		case "armor": return [
			B("prim", .28 * s, .18, .3, .04, .06, 0),
			B("sec", .12, .12, .12, .1, .12, .06),
			B("trim", .06, .06, .2, .12, .04, -.04)
		];
		case "spike": return [mass(r, "prim", .2 * s, .16, .22, .02, .04, 0), N("acc", .008, .03, .14, .08, .12, 0)];
		case "ribbon": return [B("trim", .04, .2, .28, .1, .06, 0, .3, .2, 0), mass(r, "prim", .16 * s, .12, .18, 0, .02, 0)];
		case "tanked": return [C("prim", .09, .09, .2, .04, .04, 0, Math.PI / 2, 0, 0, sg), B("metal", .16, .08, .12, 0, .1, 0)];
		case "lattice": return [
			B("metal", .04, .18, .04, .08, .04, .06),
			B("metal", .04, .18, .04, .08, .04, -.06),
			B("metal", .18, .04, .16, .04, .12, 0),
			B("dark", .1, .08, .1, 0, 0, 0)
		];
		case "cannon": return [C("metal", .04, .05, .22, .06, .06, .06, Math.PI / 2, 0, 0, sg), mass(r, "prim", .18 * s, .14, .18, 0, .02, 0)];
		case "pauldron": return [B("prim", .3 * s, .12, .32, .04, .1, 0, -.2, 0, 0), B("sec", .16, .1, .16, .04, 0, 0)];
		case "ornate": return [
			mass(r, "prim", .22 * s, .16, .24, .03, .05, 0),
			B("trim", .08, .08, .08, .1, .1, .06),
			Sp("acc", .03, .08, .12, .04, sg)
		];
		case "talon": return [
			mass(r, "prim", .18 * s, .14, .2, .02, .04, 0),
			N("metal", .008, .025, .1, .08, .02, .1, Math.PI / 2, 0, 0),
			N("metal", .008, .025, .1, .08, .08, .08, Math.PI / 2, 0, 0)
		];
		default: return [
			mass(r, "prim", .22 * s, .16 * t, .26, .03, .05, 0),
			B("sec", .09, .09, .2, .1, .12, 0),
			C("joint", .065, .065, .08, -.06, -.02, 0, 0, 0, Math.PI / 2, sg)
		];
	}
}
function upper(r) {
	const h = (r.canon === "stalker" || r.canon === "runner" ? .36 : .3) * r.height;
	const rad = .08 * r.thick;
	const sg = r.segs;
	const L = r.limb;
	if (L === "block" || L === "brick" || L === "boxer") return [B("prim", rad * 2.4, h, rad * 2.1, 0, 0, 0), B("sec", rad * 2.6, h * .35, rad * 1.5, .02, .04, .02)];
	if (L === "frame" || L === "lattice" || L === "rail") return [
		B("metal", .035, h, .035, .04, 0, .03),
		B("metal", .035, h, .035, -.04, 0, -.03),
		C("joint", .045, .045, .055, 0, h / 2, 0, 0, 0, 0, sg)
	];
	if (L === "blade" || L === "spike" || L === "talon") return [B("prim", rad * 1.5, h, rad * 2.6, 0, 0, 0), B("acc", .028, h * .75, rad * 3, .045, 0, 0)];
	if (L === "capsule" || L === "pipe" || L === "piston") return [C("prim", rad, rad - .01, h, 0, 0, 0, 0, 0, 0, sg)];
	if (L === "armor" || L === "pauldron" || L === "ornate") return [
		mass(r, "prim", rad * 2.2, h, rad * 2, 0, 0, 0),
		B("sec", rad * 1.6, h * .4, rad * 2.2, 0, .04, .04),
		...densitySeams(r, rad * 2.2, h, rad * 2, .04)
	];
	return [
		C("prim", rad, rad - .01, h, 0, 0, 0, 0, 0, 0, sg),
		B("sec", .12 * r.thick, h * .5, .1, .04, .01, .02),
		...densitySeams(r, rad * 2, h, rad * 2, .03)
	];
}
function elbow(r) {
	if (r.curve > .5 || r.limb === "capsule") return [Sp("joint", .05 * r.thick, 0, 0, 0, r.segs)];
	if (r.limb === "hinge") return [C("joint", .05, .05, .08, 0, 0, 0, 0, 0, Math.PI / 2, r.segs), B("metal", .08, .04, .08, 0, .03, 0)];
	return [B("joint", .09 * r.thick, .07, .09, 0, 0, .02), B("prim", .07, .055, .07, 0, 0, .035)];
}
function forearm(r) {
	const h = .28 * r.height;
	const L = r.limb;
	if (L === "block" || L === "brick" || L === "boxer") return [B("prim", .13 * r.thick, h, .12, 0, 0, 0), ...densitySeams(r, .13 * r.thick, h, .12, .04)];
	if (L === "blade" || L === "spike") return [B("prim", .075, h, .15, 0, 0, 0), B("acc", .028, h * .85, .18, .04, 0, 0)];
	if (L === "cannon") return [C("metal", .04, .05, h * .9, 0, 0, .04, Math.PI / 2, 0, 0, r.segs), B("prim", .1, h * .5, .1, 0, .04, -.04)];
	if (L === "piston") return [C("metal", .04, .035, h, 0, 0, 0, 0, 0, 0, r.segs), C("prim", .055, .05, h * .4, 0, .04, 0, 0, 0, 0, r.segs)];
	return [C("prim", .065 * r.thick, .055 * r.thick, h, 0, 0, 0, 0, 0, 0, r.segs), B("dark", .09, h * .5, .09, .028, 0, .01)];
}
function vambrace(r) {
	if (r.limb === "block" || r.limb === "armor" || r.canon === "heavy") return [B("prim", .15 * r.thick, .18, .15, 0, 0, 0), B("metal", .055, .14, .16, .055, 0, .02)];
	if (r.limb === "blade" || r.limb === "spike") return [B("prim", .09, .16, .11, 0, 0, 0), B("acc", .035, .14, .14, .045, 0, .02)];
	if (r.limb === "lattice" || r.limb === "frame") return [
		B("metal", .04, .16, .04, .04, 0, .04),
		B("metal", .04, .16, .04, -.03, 0, -.03),
		B("dark", .08, .1, .08, 0, 0, 0)
	];
	return [mass(r, "prim", .11 * r.thick, .15, .12, 0, 0, 0), ...densitySeams(r, .11 * r.thick, .15, .12, .05)];
}
function hand(r) {
	if (r.curve > .65 || r.canon === "drone" || r.limb === "capsule") return [Sp("prim", .065 * r.thick, 0, 0, 0, r.segs)];
	if (r.limb === "claw" || r.limb === "talon") return [
		mass(r, "prim", .07, .08, .07, 0, 0, 0),
		N("dark", .004, .012, .08, .03, -.08, .03),
		N("dark", .004, .012, .08, -.03, -.08, .03),
		N("dark", .004, .012, .07, 0, -.08, .04)
	];
	return [
		mass(r, "prim", .075, .09, .075, 0, 0, 0),
		B("dark", .028, .07, .028, .02, -.07, .025),
		B("dark", .028, .07, .028, -.02, -.07, .025),
		B("dark", .028, .06, .028, .045, -.055, 0),
		B("dark", .028, .06, .028, -.045, -.055, 0)
	];
}
function hip(r) {
	return [C("joint", .07 * r.hip, .07 * r.hip, .1, 0, 0, 0, 0, 0, Math.PI / 2, r.segs), mass(r, "prim", .14 * r.hip, .12, .16, 0, .02, 0)];
}
function thigh(r) {
	const h = (r.canon === "runner" || r.canon === "stalker" ? .38 : .32) * r.height;
	const rad = .075 * r.thick;
	const L = r.limb;
	if (L === "block" || L === "brick" || L === "boxer") return [B("prim", rad * 2.5, h, rad * 2.3, 0, 0, 0), B("sec", rad * 2.1, h * .35, rad * 2.6, 0, .04, .04)];
	if (L === "blade" || L === "spike" || L === "talon") return [B("prim", rad * 1.7, h, rad * 2.5, 0, 0, 0), B("acc", .028, h * .65, rad * 2.9, .045, 0, .02)];
	if (L === "frame" || L === "lattice" || L === "rail") return [
		B("metal", .04, h, .04, .04, 0, .03),
		B("metal", .04, h, .04, -.04, 0, -.03),
		B("dark", rad * 1.4, h * .4, rad * 1.4, 0, 0, 0)
	];
	if (L === "armor" || L === "ornate" || L === "pauldron") return [
		mass(r, "prim", rad * 2.3, h, rad * 2.1, 0, 0, 0),
		B("sec", rad * 1.8, h * .3, rad * 2.4, 0, .05, .04),
		...densitySeams(r, rad * 2.3, h, rad * 2.1, .05)
	];
	return [
		C("prim", rad, rad * .88, h, 0, 0, 0, 0, 0, 0, r.segs),
		B("sec", .11 * r.thick, h * .45, .09, 0, .02, .035),
		...densitySeams(r, rad * 2, h, rad * 2, .04)
	];
}
function knee(r) {
	if (r.canon === "heavy" || r.limb === "armor") return [B("prim", .15 * r.thick, .13, .15, 0, 0, 0), B("metal", .07, .09, .11, 0, .02, .055)];
	if (r.curve > .55 || r.limb === "capsule") return [Sp("joint", .065 * r.thick, 0, 0, 0, r.segs)];
	return [mass(r, "prim", .13 * r.thick, .11, .11, 0, 0, 0), B("sec", .07, .055, .07, 0, .02, .045)];
}
function shin(r) {
	const h = .3 * r.height;
	const L = r.limb;
	if (L === "block" || L === "brick" || L === "armor") return [B("prim", .13 * r.thick, h, .13, 0, 0, 0), B("metal", .07, h * .35, .15, 0, .04, .04)];
	if (L === "blade" || L === "spike") return [B("prim", .08, h, .14, 0, 0, 0), B("acc", .03, h * .7, .16, .04, 0, .02)];
	if (L === "frame" || L === "lattice") return [
		B("metal", .035, h, .035, .04, 0, .03),
		B("metal", .035, h, .035, -.03, 0, -.02),
		B("dark", .08, h * .4, .08, 0, 0, 0)
	];
	return [
		C("prim", .065 * r.thick, .055 * r.thick, h, 0, 0, 0, 0, 0, 0, r.segs),
		B("prim", .11 * r.thick, h * .65, .09, 0, 0, .035),
		...densitySeams(r, .11 * r.thick, h, .09, .04)
	];
}
function ankle(r) {
	return [C("joint", .045, .045, .07, 0, 0, 0, 0, 0, Math.PI / 2, r.segs), B("dark", .09 * r.thick, .07, .09, 0, 0, .018)];
}
function foot(r) {
	const L = r.canon === "heavy" ? .34 : r.canon === "stalker" ? .3 : .26;
	if (r.curve > .7 || r.limb === "capsule") return [Sp("prim", .075, 0, .02, .04, r.segs), B("dark", .11, .035, L * .8, 0, -.03, .055)];
	if (r.limb === "talon" || r.limb === "claw") return [
		mass(r, "prim", .12 * r.hip, .07, L * .7, 0, 0, .02),
		N("dark", .006, .02, .1, .04, -.02, L * .4, Math.PI / 2, 0, 0),
		N("dark", .006, .02, .1, -.04, -.02, L * .4, Math.PI / 2, 0, 0)
	];
	return [
		mass(r, "prim", .13 * r.hip, .07, L, 0, 0, .04),
		B("dark", .11, .035, L * .88, 0, -.035, .04),
		B("sec", .09, .05, .09, 0, .035, .09)
	];
}
function pack(r) {
	const s = r.segs;
	const span = .85;
	switch (r.pack) {
		case "wing": return [
			B("prim", .16, .15, .11, 0, 0, 0),
			B("sec", .06 * span, .28, .34, .14, .04, -.06, .3, .2, 0),
			B("sec", .06 * span, .28, .34, -.14, .04, -.06, .3, -.2, 0)
		];
		case "tank": return [
			C("prim", .09 * span, .09 * span, .28, .1, 0, 0, Math.PI / 2, 0, 0, s),
			C("prim", .09 * span, .09 * span, .28, -.1, 0, 0, Math.PI / 2, 0, 0, s),
			B("metal", .24, .09, .11, 0, .1, 0)
		];
		case "spine": return [
			B("prim", .09, .36, .09, 0, .04, 0),
			B("sec", .065, .08, .2, 0, .14, -.08),
			B("sec", .065, .08, .14, 0, -.1, -.06)
		];
		case "halo": return [C("trim", .17, .17, .03, 0, .08, -.04, Math.PI / 2, 0, 0, s), B("prim", .13, .11, .09, 0, 0, 0)];
		case "twin": return [
			B("prim", .08, .22, .13, .12, 0, 0),
			B("prim", .08, .22, .13, -.12, 0, 0),
			C("glow", .03, .04, .09, .12, -.1, -.08, Math.PI / 2, 0, 0, s),
			C("glow", .03, .04, .09, -.12, -.1, -.08, Math.PI / 2, 0, 0, s)
		];
		case "mast": return [
			B("prim", .12, .13, .1, 0, 0, 0),
			B("metal", .03, .38, .03, 0, .22, -.04),
			B("visor", .05, .045, .05, 0, .42, -.04)
		];
		case "shell": return [C("prim", .14, .12, .2, 0, 0, 0, Math.PI / 2, 0, 0, s), B("sec", .22, .065, .13, 0, .1, 0)];
		case "brick": return [B("prim", .26, .12, .14, 0, .06, 0), B("prim", .22, .12, .14, 0, -.06, 0)];
		case "fin": return [B("prim", .12, .12, .1, 0, 0, 0), B("trim", .03, .28, .16, 0, .1, -.04, .2, 0, 0)];
		case "rack": return [
			B("metal", .2, .04, .16, 0, .08, 0),
			B("metal", .2, .04, .16, 0, -.04, 0),
			B("dark", .04, .16, .04, .08, .02, 0),
			B("dark", .04, .16, .04, -.08, .02, 0)
		];
		case "plate": return [B("prim", .28, .22, .06, 0, 0, 0), B("sec", .16, .12, .05, 0, .04, .03)];
		case "booster": return [
			C("metal", .07, .09, .22, .08, 0, 0, Math.PI / 2, 0, 0, s),
			C("metal", .07, .09, .22, -.08, 0, 0, Math.PI / 2, 0, 0, s),
			C("glow", .05, .06, .07, .08, 0, -.14, Math.PI / 2, 0, 0, s),
			C("glow", .05, .06, .07, -.08, 0, -.14, Math.PI / 2, 0, 0, s)
		];
		case "scythe": return [
			B("prim", .12, .12, .1, 0, 0, 0),
			B("acc", .04, .1, .32, .1, .06, -.08, .4, .3, 0),
			B("acc", .04, .1, .32, -.1, .06, -.08, .4, -.3, 0)
		];
		case "ring": return [{
			t: "torus",
			m: "trim",
			s: [
				.16,
				.025,
				0
			],
			p: [
				0,
				.06,
				-.04
			],
			r: [
				Math.PI / 2,
				0,
				0
			]
		}, B("prim", .12, .1, .1, 0, 0, 0)];
		case "pod": return [
			Sp("prim", .1, .08, .04, 0, s),
			Sp("prim", .1, -.08, .04, 0, s),
			B("metal", .2, .08, .1, 0, .1, 0)
		];
		case "sail": return [
			B("prim", .1, .1, .1, 0, 0, 0),
			B("sec", .05, .32, .22, .12, .08, -.06, .15, .35, 0),
			B("sec", .05, .32, .22, -.12, .08, -.06, .15, -.35, 0)
		];
		case "turret": return [
			B("prim", .16, .12, .14, 0, 0, 0),
			C("metal", .03, .025, .22, 0, .1, .08, Math.PI / 2, 0, 0, s),
			B("dark", .08, .08, .08, 0, .12, 0)
		];
		case "canopy": return [mass(r, "prim", .22, .1, .16, 0, .04, 0, -.25, 0, 0), B("dark", .14, .08, .1, 0, -.04, 0)];
		case "claw": return [
			B("prim", .12, .1, .1, 0, 0, 0),
			N("acc", .01, .03, .16, .1, .06, -.06, .6, .3, 0),
			N("acc", .01, .03, .16, -.1, .06, -.06, .6, -.3, 0)
		];
		case "fold": return [
			B("prim", .1, .2, .08, .08, 0, 0, 0, 0, .3),
			B("prim", .1, .2, .08, -.08, 0, 0, 0, 0, -.3),
			B("metal", .16, .06, .1, 0, .1, 0)
		];
		case "disc": return [C("prim", .16, .16, .04, 0, .06, 0, 0, 0, 0, s), B("sec", .1, .1, .1, 0, -.04, 0)];
		case "arch": return [
			C("trim", .14, .14, .04, 0, .12, 0, Math.PI / 2, 0, 0, s),
			B("prim", .08, .16, .08, .1, 0, 0),
			B("prim", .08, .16, .08, -.1, 0, 0)
		];
		case "stack": {
			const n = 2 + Math.floor(r.density / 4);
			const out = [];
			for (let i = 0; i < n; i++) out.push(mass(r, i % 2 ? "sec" : "prim", .22 - i * .03, .07, .14, 0, .1 - i * .08, 0));
			return out;
		}
		case "crystal": return [
			B("prim", .12, .1, .1, 0, 0, 0),
			{
				t: "octa",
				m: "acc",
				s: [
					.07,
					0,
					0
				],
				p: [
					0,
					.14,
					-.04
				]
			},
			{
				t: "octa",
				m: "trim",
				s: [
					.04,
					0,
					0
				],
				p: [
					.1,
					.06,
					0
				]
			}
		];
		default: return [
			mass(r, "prim", .26, .22, .14, 0, 0, 0),
			C("metal", .05, .07, .11, .09, -.04, -.08, Math.PI / 2, 0, 0, s),
			C("metal", .05, .07, .11, -.09, -.04, -.08, Math.PI / 2, 0, 0, s)
		];
	}
}
function thruster(r) {
	const glow = r.curve > .5 ? .06 : .05;
	return [
		C("metal", .06, .08, .16, 0, 0, 0, Math.PI / 2, 0, 0, r.segs),
		C("glow", glow, glow + .01, .06, 0, 0, -.1, Math.PI / 2, 0, 0, r.segs),
		B("prim", .08, .1, .08, 0, .04, .02)
	];
}
function binder(r) {
	const k = (r.greeble * 5 + r.code.serial * 11) % 12;
	const s = r.segs;
	const stretch = .75 + r.code.serial % 6 * .1;
	const lean = (r.code.serial % 9 - 4) * .1;
	const lift = (r.greeble % 5 - 2) * .02;
	switch (k) {
		case 0: return [
			B("acc", .04, .1 + stretch * .12, .42 * stretch, 0, .04 + lift, -.08, .55 + lean, .2, 0),
			B("sec", .03, .08, .14, 0, .1, .04),
			C("glow", .02, .025, .06, 0, -.04, -.22, Math.PI / 2, 0, 0, s)
		];
		case 1: return [
			B("prim", .12 * stretch, .16, .1, 0, lift, 0),
			C("glow", .035, .045, .14, 0, -.08, -.1, Math.PI / 2, 0, 0, s),
			B("metal", .04, .1, .04, .06, .04, 0)
		];
		case 2: return [
			C("prim", .05 * stretch, .04, .32 * stretch, 0, .02, -.06, Math.PI / 2, .3 + lean, 0, s),
			C("glow", .03, .04, .09, 0, 0, -.24, Math.PI / 2, 0, 0, s),
			B("trim", .07, .05, .07, 0, .06, .04)
		];
		case 3: return [
			B("dark", .09, .08, .24 * stretch, 0, lift, 0),
			Sp("glow", .04, .06, .07, -.1, s),
			Sp("glow", .04, -.06, .07, -.1, s),
			B("acc", .03, .12, .03, 0, .1, 0)
		];
		case 4: return [
			B("sec", .035, .1, .4 * stretch, 0, .08 + lift, -.1, .75, .4 + lean, 0),
			B("prim", .08, .07, .1, 0, 0, .05),
			N("acc", .01, .03, .1, 0, .16, -.16)
		];
		case 5: return [
			B("prim", .12 * stretch, .035, .26, 0, .08 + lift, -.04),
			B("prim", .09, .035, .2, 0, .02, -.02),
			B("prim", .06, .035, .14, 0, -.04, 0),
			B("dark", .04, .08, .04, 0, .04, .08)
		];
		case 6: return [
			C("metal", .045, .07, .22 * stretch, 0, lift, 0, Math.PI / 2, 0, 0, s),
			C("glow", .04, .05, .08, 0, 0, -.16, Math.PI / 2, 0, 0, s),
			B("trim", .1, .05, .06, 0, .06, .05),
			B("sec", .03, .12, .08, .06, .02, -.04, 0, lean, 0)
		];
		case 7: return [
			B("prim", .14 * stretch, .22, .04, 0, .05 + lift, 0, .25, 0, lean),
			B("sec", .06, .12, .035, 0, .08, .03),
			C("joint", .03, .03, .06, 0, -.06, 0, 0, 0, Math.PI / 2, s)
		];
		case 8: return [
			B("acc", .035, .18 * stretch, .12, .05, .05 + lift, -.02, .45, .25 + lean, 0),
			B("acc", .035, .18 * stretch, .12, -.05, .05 + lift, -.02, .45, -.25 - lean, 0),
			B("dark", .09, .07, .09, 0, 0, .02),
			Sp("glow", .025, 0, .12, -.08, s)
		];
		case 9: return [
			C("prim", .07 * stretch, .07 * stretch, .18, 0, lift, 0, 0, 0, 0, 6),
			B("trim", .12, .035, .12, 0, .1, 0),
			N("metal", .008, .04, .12, 0, .16, 0)
		];
		case 10: return [
			B("sec", .045, .22 * stretch, .16, .08, .03 + lift, -.06, .25, .35 + lean, 0),
			B("sec", .045, .22 * stretch, .16, -.08, .03 + lift, -.06, .25, -.35 - lean, 0),
			B("prim", .08, .08, .08, 0, 0, .02)
		];
		default: return [
			B("metal", .035, .32 * stretch, .035, 0, .12 + lift, -.05),
			B("prim", .11, .09, .11, 0, 0, 0),
			C("glow", .022, .03, .07, 0, .26, -.08, Math.PI / 2, 0, 0, s),
			B("acc", .05, .05, .16, 0, .04, -.08, .5, lean, 0)
		];
	}
}
function stabilizer(r) {
	return [B("prim", .08, .22 * r.height, .1, 0, -.06, 0, .3, 0, 0), B("sec", .04, .14, .06, 0, -.1, 0)];
}
function specsFor(slotId, variant, beamZ = 1) {
	if (variant === "none") return [];
	if (slotId === "weaponR" || slotId === "weaponL") return weaponSpecs(variant, beamZ);
	if (slotId === "shield") return ensureLR(shieldSpecs(variant));
	if (slotId.startsWith("extra")) return ensureLR(extraSpecs(variant));
	const r = getRecipe(variant);
	const b = base(slotId);
	let raw;
	switch (b) {
		case "helm":
			raw = helm(r);
			break;
		case "visor":
			raw = visor(r);
			break;
		case "brow":
			raw = brow(r);
			break;
		case "eye":
			raw = eye(r);
			break;
		case "nose":
			raw = nose(r);
			break;
		case "mouth":
			raw = mouth(r);
			break;
		case "jaw":
			raw = jaw(r);
			break;
		case "ear":
			raw = ear(r);
			break;
		case "vfin":
			raw = vfin(r);
			break;
		case "antenna":
			raw = antenna(r);
			break;
		case "cheek":
			raw = cheek(r);
			break;
		case "chin":
			raw = chin(r);
			break;
		case "collar":
			raw = collar(r);
			break;
		case "chestCore":
			raw = chestCore(r);
			break;
		case "pec":
			raw = pec(r);
			break;
		case "cockpit":
			raw = cockpit(r);
			break;
		case "abdomen":
			raw = abdomen(r);
			break;
		case "pelvis":
			raw = pelvis(r);
			break;
		case "skirtF":
			raw = skirtF(r);
			break;
		case "skirtB":
			raw = skirtB(r);
			break;
		case "skirt":
			raw = skirtS(r);
			break;
		case "shoulder":
			raw = shoulder(r);
			break;
		case "upper":
			raw = upper(r);
			break;
		case "elbow":
			raw = elbow(r);
			break;
		case "forearm":
			raw = forearm(r);
			break;
		case "vambrace":
			raw = vambrace(r);
			break;
		case "hand":
			raw = hand(r);
			break;
		case "hip":
			raw = hip(r);
			break;
		case "thigh":
			raw = thigh(r);
			break;
		case "knee":
			raw = knee(r);
			break;
		case "shin":
			raw = shin(r);
			break;
		case "ankle":
			raw = ankle(r);
			break;
		case "foot":
			raw = foot(r);
			break;
		case "pack":
			raw = pack(r);
			break;
		case "thruster":
			raw = thruster(r);
			break;
		case "binder":
			raw = binder(r);
			break;
		case "stabilizer":
			raw = stabilizer(r);
			break;
		default: raw = [B("prim", .12, .12, .12, 0, 0, 0)];
	}
	return ensureLR([...raw, ...dressPart2(raw, r, slotId)]);
}
function weaponSpecs(v, beamZ = 1) {
	const L = Math.max(.35, beamZ);
	const rx = Math.PI / 2;
	const grip = () => [B("dark", .038, .12, .045, 0, -.02, 0)];
	if (v === "rifle") return [
		...grip(),
		B("dark", .05, .05, .26, 0, .09, .1),
		C("metal", .018, .018, .22, 0, .1, .3, rx, 0, 0),
		B("sec", .055, .04, .09, 0, .08, -.1),
		B("acc", .025, .025, .07, 0, .13, .06)
	];
	if (v === "longrifle") return [
		...grip(),
		B("dark", .048, .048, .38, 0, .09, .16),
		C("metal", .016, .016, .3, 0, .1, .48, rx, 0, 0),
		B("prim", .06, .04, .1, 0, .08, -.12),
		B("sec", .07, .03, .07, 0, .13, .08)
	];
	if (v === "machinegun") return [
		...grip(),
		B("dark", .075, .07, .2, 0, .09, .08),
		C("metal", .016, .016, .16, .028, .1, .24, rx, 0, 0),
		C("metal", .016, .016, .16, -.028, .1, .24, rx, 0, 0),
		C("dark", .04, .04, .1, 0, -.08, .04)
	];
	if (v === "cannon") return [
		B("dark", .05, .12, .055, 0, -.02, 0),
		C("metal", .055, .065, .3, 0, .1, .18, rx, 0, 0),
		B("prim", .11, .1, .12, 0, .08, -.04),
		C("glow", .035, .045, .055, 0, .1, .36, rx, 0, 0)
	];
	if (v === "shotgun") return [
		...grip(),
		B("dark", .065, .06, .16, 0, .09, .06),
		C("metal", .026, .03, .14, .024, .1, .2, rx, 0, 0),
		C("metal", .026, .03, .14, -.024, .1, .2, rx, 0, 0)
	];
	if (v === "sniper") return [
		...grip(),
		B("dark", .042, .045, .46, 0, .09, .18),
		C("metal", .014, .014, .26, 0, .1, .52, rx, 0, 0),
		C("visor", .018, .018, .07, 0, .14, .06)
	];
	if (v === "pistol") return [
		B("dark", .036, .11, .042, 0, -.02, 0),
		B("dark", .048, .05, .1, 0, .08, .05),
		C("metal", .014, .014, .07, 0, .09, .12, rx, 0, 0)
	];
	if (v === "smg") return [
		...grip(),
		B("dark", .055, .055, .14, 0, .09, .06),
		C("metal", .014, .014, .12, 0, .1, .16, rx, 0, 0),
		B("acc", .07, .035, .05, 0, .04, .02)
	];
	if (v === "bazooka") return [
		B("dark", .048, .12, .055, 0, -.02, 0),
		C("prim", .065, .075, .34, 0, .1, .14, rx, 0, 0),
		B("dark", .09, .08, .1, 0, .08, -.08),
		N("acc", .018, .055, .07, 0, .1, .34, rx, 0, 0)
	];
	if (v === "vulcan") return [
		...grip(),
		B("metal", .09, .07, .12, 0, .1, .06),
		C("metal", .011, .011, .14, .036, .11, .16, rx, 0, 0),
		C("metal", .011, .011, .14, -.036, .11, .16, rx, 0, 0),
		C("metal", .011, .011, .14, 0, .07, .16, rx, 0, 0)
	];
	if (v === "saber") {
		const bl = .42 * L;
		return [
			C("dark", .022, .026, .12, 0, 0, 0, rx, 0, 0),
			B("acc", .04, .04, .03, 0, 0, .07),
			C("visor", .016, .01, bl, 0, 0, .085 + bl / 2, rx, 0, 0)
		];
	}
	if (v === "beamdagger") {
		const bl = .22 * L;
		return [
			C("dark", .02, .024, .1, 0, 0, 0, rx, 0, 0),
			B("acc", .034, .034, .028, 0, 0, .06),
			C("visor", .013, .008, bl, 0, 0, .07 + bl / 2, rx, 0, 0)
		];
	}
	if (v === "naginata") {
		const bl = .7 * L;
		return [
			C("dark", .018, .02, .16, 0, 0, 0, rx, 0, 0),
			B("metal", .038, .038, .04, 0, 0, .1),
			C("visor", .013, .01, bl, 0, 0, .12 + bl / 2, rx, 0, 0)
		];
	}
	if (v === "twin") {
		const bl = .32 * L;
		return [
			B("dark", .1, .05, .08, 0, 0, 0),
			C("visor", .012, .01, bl, .04, 0, .05 + bl / 2, rx, 0, 0),
			C("visor", .012, .01, bl, -.04, 0, .05 + bl / 2, rx, 0, 0)
		];
	}
	if (v === "dagger") return [
		C("dark", .016, .018, .09, 0, 0, 0, rx, 0, 0),
		B("metal", .028, .028, .028, 0, 0, .05),
		B("metal", .018, .01, .15, 0, 0, .14),
		N("metal", .002, .011, .04, 0, 0, .23, rx, 0, 0)
	];
	if (v === "longsword") return [
		C("dark", .018, .02, .12, 0, 0, 0, rx, 0, 0),
		B("acc", .075, .018, .028, 0, 0, .07),
		B("metal", .022, .01, .4, 0, 0, .28),
		N("metal", .002, .013, .055, 0, 0, .5, rx, 0, 0)
	];
	if (v === "axe") return [
		C("dark", .018, .022, .28, 0, 0, .12, rx, 0, 0),
		B("dark", .045, .045, .04, 0, 0, .24),
		B("metal", .16, .12, .045, 0, .01, .255),
		B("metal", .09, .16, .032, .055, .01, .255, 0, 0, .38)
	];
	if (v === "hammer") return [
		C("dark", .02, .024, .26, 0, 0, .11, rx, 0, 0),
		B("metal", .04, .04, .04, 0, 0, .22),
		B("metal", .14, .1, .11, 0, .01, .255),
		B("dark", .16, .055, .08, 0, .01, .255)
	];
	if (v === "spear") return [
		C("dark", .016, .018, .14, 0, 0, 0, rx, 0, 0),
		C("metal", .012, .012, .48, 0, 0, .3, rx, 0, 0),
		N("acc", .004, .028, .1, 0, 0, .58, rx, 0, 0)
	];
	if (v === "mace") return [
		C("dark", .02, .022, .14, 0, 0, 0, rx, 0, 0),
		Sp("metal", .065, 0, .02, .2, 8),
		N("metal", .01, .028, .045, .05, .04, .22),
		N("metal", .01, .028, .045, -.05, .04, .22)
	];
	return [];
}
function shieldSpecs(v) {
	const mount = B("dark", .06, .05, .042, 0, .09, -.04);
	if (v === "round") return [
		mount,
		C("prim", .16, .16, .04, 0, .18, 0, Math.PI / 2, 0, 0, 16),
		C("sec", .08, .08, .05, 0, .18, .02, Math.PI / 2, 0, 0, 16)
	];
	if (v === "tower") return [
		mount,
		B("prim", .22, .48, .05, 0, .27, 0),
		B("sec", .1, .16, .06, 0, .34, .02),
		B("acc", .06, .07, .05, 0, .1, .02)
	];
	if (v === "buckler") return [
		mount,
		C("prim", .1, .1, .04, 0, .12, 0, Math.PI / 2, 0, 0, 16),
		B("metal", .04, .04, .05, 0, .12, .03)
	];
	if (v === "heater") return [
		mount,
		B("prim", .2, .3, .045, 0, .2, 0),
		B("prim", .14, .08, .045, 0, .06, 0),
		B("sec", .08, .1, .05, 0, .22, .02)
	];
	if (v === "scutum") return [
		mount,
		B("prim", .28, .38, .05, 0, .22, 0),
		C("sec", .12, .12, .04, 0, .24, .03, Math.PI / 2, 0, 0, 16)
	];
	if (v === "hex") return [
		mount,
		C("prim", .16, .16, .045, 0, .18, 0, Math.PI / 2, 0, 0, 6),
		B("trim", .06, .06, .05, 0, .18, .03)
	];
	if (v === "penta") return [
		mount,
		C("prim", .15, .15, .045, 0, .18, 0, Math.PI / 2, 0, 0, 5),
		B("acc", .05, .05, .05, 0, .18, .03)
	];
	if (v === "oval") return [
		mount,
		C("prim", .12, .18, .04, 0, .2, 0, Math.PI / 2, 0, 0, 16),
		B("sec", .06, .1, .045, 0, .2, .02)
	];
	if (v === "delta") return [
		mount,
		C("prim", .02, .2, .3, 0, .16, 0, 0, 0, 0, 3),
		B("dark", .06, .06, .04, 0, .12, .02)
	];
	if (v === "cross") return [
		mount,
		B("prim", .28, .1, .04, 0, .2, 0),
		B("prim", .1, .3, .04, 0, .2, 0),
		B("acc", .06, .06, .05, 0, .2, .03)
	];
	if (v === "spike") return [
		mount,
		C("prim", .14, .14, .045, 0, .16, 0, Math.PI / 2, 0, 0, 12),
		N("metal", .01, .04, .1, 0, .3, 0),
		N("metal", .01, .03, .08, .1, .16, 0),
		N("metal", .01, .03, .08, -.1, .16, 0)
	];
	if (v === "wing") return [
		mount,
		B("prim", .1, .26, .04, 0, .16, 0),
		B("sec", .16, .07, .03, .12, .22, 0, .3, .4, 0),
		B("sec", .16, .07, .03, -.12, .22, 0, .3, -.4, 0)
	];
	if (v === "slab") return [
		mount,
		B("prim", .24, .16, .08, 0, .11, 0),
		B("dark", .2, .035, .07, 0, .04, 0)
	];
	if (v === "dish") return [
		mount,
		{
			t: "hemi",
			m: "prim",
			s: [
				.16,
				0,
				0
			],
			p: [
				0,
				.14,
				0
			]
		},
		C("sec", .08, .08, .03, 0, .14, .04, Math.PI / 2, 0, 0, 16)
	];
	if (v === "blade") return [
		mount,
		B("prim", .08, .4, .03, 0, .24, 0, 0, 0, .15),
		B("metal", .06, .07, .04, 0, .08, .01)
	];
	if (v === "lattice") return [
		mount,
		B("prim", .22, .04, .04, 0, .34, 0),
		B("prim", .22, .04, .04, 0, .1, 0),
		B("prim", .04, .28, .04, .09, .22, 0),
		B("prim", .04, .28, .04, -.09, .22, 0)
	];
	if (v === "diamond") return [
		mount,
		B("prim", .18, .18, .045, 0, .2, 0, 0, 0, Math.PI / 4),
		B("sec", .08, .08, .05, 0, .2, .02, 0, 0, Math.PI / 4)
	];
	if (v === "capsule") return [
		mount,
		{
			t: "capsule",
			m: "prim",
			s: [
				.1,
				.2,
				0
			],
			p: [
				0,
				.2,
				0
			]
		},
		B("sec", .06, .1, .05, 0, .2, .04)
	];
	if (v === "layer") return [
		mount,
		B("prim", .22, .26, .03, 0, .18, 0),
		B("sec", .16, .18, .03, 0, .18, .03),
		B("acc", .1, .1, .03, 0, .18, .06)
	];
	return [
		mount,
		B("prim", .18, .32, .045, 0, .22, 0),
		B("prim", .12, .08, .045, 0, .06, 0),
		B("sec", .08, .12, .05, 0, .24, .02),
		B("acc", .05, .05, .04, 0, .1, .02)
	];
}
function extraSpecs(v) {
	const id = EXTRA_LEGACY[v] ?? v;
	if (WING_IDS.includes(id)) return extraWing(id);
	const mi = MOD_IDS.indexOf(id);
	if (mi >= 0) return extraModular(mi + 1);
	const wi = WPN_IDS.indexOf(id);
	if (wi >= 0) return extraWeapon(wi + 1);
	const ai = ACC_IDS.indexOf(id);
	if (ai >= 0) return extraAcc(ai + 1);
	return extraShape(id);
}
function extraWing(id) {
	if (id === "deltaWing") return [
		B("prim", .62, .02, .18, 0, 0, 0),
		B("prim", .34, .016, .26, 0, 0, -.08),
		B("trim", .08, .028, .08, 0, .01, .05),
		B("dark", .04, .018, .12, .22, 0, -.02, 0, .2, 0),
		B("dark", .04, .018, .12, -.22, 0, -.02, 0, -.2, 0)
	];
	if (id === "sweptWing") return [
		B("prim", .66, .018, .12, 0, 0, 0, 0, .5, 0),
		B("sec", .22, .016, .1, .16, 0, -.05, 0, .5, 0),
		B("sec", .22, .016, .1, -.16, 0, -.05, 0, -.5, 0),
		B("trim", .1, .024, .06, 0, .01, .04)
	];
	if (id === "canardWing") return [
		B("prim", .36, .016, .09, 0, 0, .05),
		B("acc", .14, .014, .12, .12, 0, -.02, 0, .35, 0),
		B("acc", .14, .014, .12, -.12, 0, -.02, 0, -.35, 0),
		B("dark", .06, .02, .06, 0, .01, .02)
	];
	if (id === "stubWing") return [
		B("prim", .44, .026, .1, 0, 0, 0),
		B("dark", .14, .032, .08, 0, .01, .02),
		C("metal", .018, .018, .08, .16, 0, 0, Math.PI / 2, 0, 0),
		C("metal", .018, .018, .08, -.16, 0, 0, Math.PI / 2, 0, 0),
		B("trim", .08, .02, .14, 0, 0, -.04)
	];
	return [
		B("prim", .28, .018, .22, .14, 0, 0, .12, .55, .18),
		B("prim", .28, .018, .22, -.14, 0, 0, .12, -.55, -.18),
		B("trim", .1, .026, .08, 0, 0, 0),
		B("sec", .06, .016, .16, .2, 0, -.04, 0, .4, 0),
		B("sec", .06, .016, .16, -.2, 0, -.04, 0, -.4, 0)
	];
}
function extraShape(id) {
	switch (id) {
		case "cube": return [B("prim", .16, .16, .16, 0, 0, 0)];
		case "cuboid": return [B("prim", .12, .22, .12, 0, 0, 0)];
		case "sphere": return [Sp("prim", .1, 0, 0, 0, 16)];
		case "cylinder": return [C("prim", .07, .07, .2, 0, 0, 0, 0, 0, 0, 16)];
		case "cone": return [N("prim", .01, .09, .2, 0, 0, 0)];
		case "torus": return [{
			t: "torus",
			m: "prim",
			s: [
				.08,
				.03,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "tetra": return [{
			t: "tetra",
			m: "prim",
			s: [
				.12,
				0,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "octa": return [{
			t: "octa",
			m: "prim",
			s: [
				.12,
				0,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "dodeca": return [{
			t: "dodeca",
			m: "prim",
			s: [
				.11,
				0,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "icosa": return [{
			t: "icosa",
			m: "prim",
			s: [
				.12,
				0,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "pyramid": return [C("prim", .01, .1, .18, 0, 0, 0, 0, 0, 0, 3)];
		case "prism": return [C("prim", .08, .08, .18, 0, 0, 0, 0, 0, 0, 3)];
		case "hexprism": return [C("prim", .08, .08, .18, 0, 0, 0, 0, 0, 0, 6)];
		case "capsule": return [{
			t: "capsule",
			m: "prim",
			s: [
				.06,
				.14,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "disc": return [C("prim", .11, .11, .04, 0, 0, 0, 0, 0, 0, 16)];
		case "ring": return [{
			t: "torus",
			m: "prim",
			s: [
				.09,
				.018,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "wedge": return [B("prim", .16, .12, .2, 0, 0, 0, .45, 0, 0)];
		case "cross": return [
			B("prim", .2, .05, .05, 0, 0, 0),
			B("prim", .05, .2, .05, 0, 0, 0),
			B("prim", .05, .05, .2, 0, 0, 0)
		];
		case "hemisphere": return [{
			t: "hemi",
			m: "prim",
			s: [
				.1,
				0,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		case "knot": return [{
			t: "knot",
			m: "prim",
			s: [
				.07,
				.022,
				0
			],
			p: [
				0,
				0,
				0
			]
		}];
		default: return [];
	}
}
function extraModular(n) {
	switch (n) {
		case 1: return [C("metal", .07, .09, .2, 0, 0, 0, Math.PI / 2, 0, 0), C("glow", .05, .06, .07, 0, 0, -.14, Math.PI / 2, 0, 0)];
		case 2: return [
			C("metal", .05, .07, .18, .08, 0, 0, Math.PI / 2, 0, 0),
			C("metal", .05, .07, .18, -.08, 0, 0, Math.PI / 2, 0, 0),
			C("glow", .04, .05, .06, .08, 0, -.12, Math.PI / 2, 0, 0),
			C("glow", .04, .05, .06, -.08, 0, -.12, Math.PI / 2, 0, 0)
		];
		case 3: return [
			B("prim", .18, .14, .22, 0, 0, 0),
			B("dark", .16, .04, .2, 0, .08, 0),
			B("metal", .04, .08, .04, .1, 0, .1)
		];
		case 4: return [C("prim", .08, .08, .16, 0, 0, 0, Math.PI / 2, 0, 0), B("sec", .1, .08, .1, 0, .06, 0)];
		case 5: return [C("metal", .07, .07, .24, 0, 0, 0, Math.PI / 2, 0, 0), C("dark", .05, .05, .08, 0, 0, .14, Math.PI / 2, 0, 0)];
		case 6: return [
			B("prim", .06, .16, .32, 0, .02, -.04, .3, .2, 0),
			B("sec", .04, .08, .18, 0, .04, 0),
			C("glow", .025, .03, .08, 0, -.04, -.16, Math.PI / 2, 0, 0)
		];
		case 7: return [
			B("dark", .14, .06, .1, 0, 0, 0),
			B("metal", .03, .08, .08, .05, -.04, 0),
			B("metal", .03, .08, .08, -.05, -.04, 0)
		];
		case 8: return [C("prim", .06, .05, .2, 0, 0, 0, Math.PI / 2, 0, 0), N("acc", .02, .05, .08, 0, 0, .14, Math.PI / 2, 0, 0)];
		case 9: return [B("prim", .12, .22, .06, 0, 0, 0, .2, 0, 0), B("sec", .06, .12, .05, 0, .04, .02)];
		case 10: return [
			C("metal", .03, .04, .1, .06, .04, -.04, Math.PI / 2, 0, 0),
			C("metal", .03, .04, .1, -.06, .04, -.04, Math.PI / 2, 0, 0),
			C("glow", .02, .025, .05, .06, .04, -.1, Math.PI / 2, 0, 0),
			C("glow", .02, .025, .05, -.06, .04, -.1, Math.PI / 2, 0, 0)
		];
		case 11: return [B("prim", .2, .12, .16, 0, 0, 0), B("sec", .08, .18, .1, 0, .08, -.04)];
		case 12: return [B("prim", .08, .2, .16, 0, -.04, 0, .25, 0, 0), B("acc", .04, .14, .12, .03, -.02, 0)];
		case 13: return [B("prim", .14, .1, .16, 0, 0, 0), C("metal", .04, .05, .14, 0, .02, .1, Math.PI / 2, 0, 0)];
		case 14: return [B("dark", .16, .12, .14, 0, 0, 0), B("prim", .1, .08, .1, 0, 0, .08)];
		case 15: return [C("trim", .12, .12, .04, 0, 0, 0, Math.PI / 2, 0, 0), C("glow", .06, .06, .03, 0, 0, -.03, Math.PI / 2, 0, 0)];
		case 16: return [B("prim", .22, .08, .12, 0, 0, 0, .15, 0, 0), B("dark", .18, .05, .1, 0, -.04, 0)];
		case 17: return [B("sec", .05, .14, .28, .1, .04, -.04, .35, .2, 0), B("sec", .05, .14, .28, -.1, .04, -.04, .35, -.2, 0)];
		case 18: return [Sp("prim", .08, 0, .04, 0), C("metal", .02, .015, .12, 0, .12, 0)];
		case 19: return [
			B("metal", .16, .1, .1, 0, 0, 0),
			C("dark", .03, .03, .12, .06, .06, 0),
			C("dark", .03, .03, .12, -.06, .06, 0)
		];
		default: return [B("prim", .16, .04, .2, 0, 0, 0), B("dark", .14, .03, .18, 0, .03, 0)];
	}
}
function extraWeapon(n) {
	switch (n) {
		case 1: return [C("metal", .05, .06, .3, 0, 0, .06, Math.PI / 2, 0, 0), B("prim", .1, .1, .12, 0, 0, -.08)];
		case 2: return [
			B("dark", .12, .1, .16, 0, 0, 0),
			C("prim", .02, .02, .14, .03, .02, .08, Math.PI / 2, 0, 0),
			C("prim", .02, .02, .14, -.03, .02, .08, Math.PI / 2, 0, 0),
			C("prim", .02, .02, .14, .03, -.02, .08, Math.PI / 2, 0, 0),
			C("prim", .02, .02, .14, -.03, -.02, .08, Math.PI / 2, 0, 0)
		];
		case 3: return [
			B("dark", .04, .08, .1, 0, 0, 0),
			C("visor", .01, .008, .22, .04, .02, .08, Math.PI / 2, 0, 0),
			C("visor", .01, .008, .22, -.04, .02, .08, Math.PI / 2, 0, 0)
		];
		case 4: return [
			B("dark", .1, .08, .1, 0, 0, 0),
			C("metal", .018, .018, .1, .03, .03, .06, Math.PI / 2, 0, 0),
			C("metal", .018, .018, .1, -.03, .03, .06, Math.PI / 2, 0, 0)
		];
		case 5: return [
			B("prim", .1, .12, .18, 0, 0, 0),
			C("metal", .03, .025, .36, 0, .02, .24, Math.PI / 2, 0, 0),
			B("acc", .06, .06, .08, 0, .08, .04)
		];
		case 6: return [
			B("dark", .1, .1, .2, 0, 0, 0),
			C("metal", .025, .025, .22, .04, .02, .16, Math.PI / 2, 0, 0),
			C("metal", .025, .025, .22, -.04, .02, .16, Math.PI / 2, 0, 0),
			C("dark", .05, .05, .1, 0, -.08, 0)
		];
		case 7: return [
			B("prim", .08, .1, .22, 0, 0, 0),
			C("metal", .02, .02, .4, 0, .02, .28, Math.PI / 2, 0, 0),
			B("sec", .1, .06, .1, 0, .08, .06)
		];
		case 8: return [B("dark", .1, .12, .18, 0, 0, 0), C("metal", .04, .05, .16, 0, .02, .14, Math.PI / 2, 0, 0)];
		case 9: return [B("dark", .04, .08, .14, 0, 0, 0), B("glow", .03, .16, .2, 0, .08, .1, .4, 0, 0)];
		case 10: return [
			C("metal", .02, .014, .55, 0, 0, .16, Math.PI / 2, 0, 0),
			B("prim", .07, .07, .12, 0, 0, -.08),
			N("acc", .01, .028, .08, 0, 0, .46, Math.PI / 2, 0, 0)
		];
		case 11: return [
			C("metal", .08, .09, .28, 0, 0, .06, Math.PI / 2, 0, 0),
			B("prim", .16, .14, .16, 0, 0, -.1),
			C("glow", .05, .06, .06, 0, 0, .22, Math.PI / 2, 0, 0)
		];
		case 12: return [
			B("prim", .16, .08, .1, 0, 0, 0),
			B("prim", .05, .05, .14, .06, .06, .04),
			B("prim", .05, .05, .14, -.06, .06, .04),
			C("glow", .02, .025, .05, .06, .06, -.06, Math.PI / 2, 0, 0)
		];
		case 13: return [B("dark", .08, .08, .12, 0, 0, 0), C("metal", .015, .015, .2, 0, .02, .14, Math.PI / 2, 0, 0)];
		case 14: return [
			B("dark", .14, .06, .08, 0, 0, 0),
			C("metal", .012, .012, .1, .04, 0, .08, Math.PI / 2, 0, 0),
			C("metal", .012, .012, .1, -.04, 0, .08, Math.PI / 2, 0, 0)
		];
		case 15: return [
			B("prim", .12, .1, .16, 0, 0, 0),
			C("metal", .03, .03, .2, .05, 0, .12, Math.PI / 2, 0, 0),
			C("dark", .04, .04, .08, 0, -.08, 0)
		];
		case 16: return [
			C("prim", .03, .025, .16, 0, 0, .06, Math.PI / 2, 0, 0),
			B("dark", .06, .06, .08, 0, 0, -.04),
			N("acc", .01, .03, .06, 0, 0, .16, Math.PI / 2, 0, 0)
		];
		case 17: return [
			C("visor", .012, .01, .28, .04, 0, .12, Math.PI / 2, 0, 0),
			C("visor", .012, .01, .28, -.04, 0, .12, Math.PI / 2, 0, 0),
			B("dark", .1, .06, .08, 0, 0, 0)
		];
		case 18: return [B("prim", .16, .22, .05, 0, 0, 0), C("metal", .03, .035, .16, 0, .04, .08, Math.PI / 2, 0, 0)];
		case 19: return [
			B("dark", .06, .08, .5, 0, 0, .1),
			C("metal", .018, .018, .22, 0, .02, .36, Math.PI / 2, 0, 0),
			B("sec", .08, .06, .1, 0, .06, .08)
		];
		default: return [
			B("dark", .14, .1, .18, 0, 0, 0),
			C("prim", .018, .018, .12, .04, .03, .1, Math.PI / 2, 0, 0),
			C("prim", .018, .018, .12, -.04, .03, .1, Math.PI / 2, 0, 0),
			C("prim", .018, .018, .12, 0, -.03, .1, Math.PI / 2, 0, 0)
		];
	}
}
function extraAcc(n) {
	switch (n) {
		case 1: return [
			C("metal", .012, .01, .28, 0, .1, 0),
			B("visor", .04, .03, .03, 0, .24, 0),
			B("dark", .05, .03, .05, 0, 0, 0)
		];
		case 2: return [
			C("metal", .01, .008, .22, .04, .08, 0),
			C("metal", .01, .008, .22, -.04, .08, 0),
			B("acc", .03, .03, .03, .04, .2, 0),
			B("acc", .03, .03, .03, -.04, .2, 0)
		];
		case 3: return [B("trim", .04, .18, .08, 0, .06, 0, .2, 0, 0), B("glow", .02, .12, .04, 0, .08, .03)];
		case 4: return [
			B("trim", .16, .05, .06, 0, .08, 0),
			B("acc", .04, .1, .04, .06, .1, 0),
			B("acc", .04, .1, .04, -.06, .1, 0)
		];
		case 5: return [Sp("visor", .05, 0, .02, .02), B("dark", .08, .04, .04, 0, -.04, 0)];
		case 6: return [N("acc", .015, .04, .16, 0, .08, 0), B("metal", .05, .04, .05, 0, 0, 0)];
		case 7: return [
			B("dark", .1, .04, .06, 0, .06, .04),
			C("metal", .01, .01, .08, .03, .06, .08, Math.PI / 2, 0, 0),
			C("metal", .01, .01, .08, -.03, .06, .08, Math.PI / 2, 0, 0)
		];
		case 8: return [B("prim", .08, .06, .16, 0, 0, 0), C("glow", .03, .04, .06, 0, 0, -.1, Math.PI / 2, 0, 0)];
		case 9: return [B("glow", .16, .03, .03, 0, .04, .04), B("glow", .03, .12, .03, .08, 0, .04)];
		case 10: return [B("acc", .03, .16, .2, 0, .04, 0, .4, .15, 0)];
		case 11: return [N("metal", .01, .03, .1, 0, -.04, .06, Math.PI / 2, 0, 0), B("dark", .06, .04, .06, 0, 0, 0)];
		case 12: return [B("prim", .06, .1, .12, 0, 0, 0), B("acc", .03, .12, .08, .04, .02, .02)];
		case 13: return [C("visor", .03, .03, .04, 0, .04, .02, Math.PI / 2, 0, 0), B("dark", .06, .04, .05, 0, 0, 0)];
		case 14: return [C("metal", .008, .006, .2, 0, .08, 0), B("sec", .04, .03, .04, 0, 0, 0)];
		case 15: return [C("trim", .1, .1, .03, 0, .08, 0, 0, 0, 0, 16), B("prim", .06, .05, .05, 0, 0, 0)];
		case 16: return [N("acc", .01, .035, .14, .06, .04, 0), N("acc", .01, .035, .14, -.06, .04, 0)];
		case 17: return [Sp("glow", .045, 0, .02, .02), B("trim", .08, .03, .06, 0, -.03, 0)];
		case 18: return [B("prim", .05, .16, .08, 0, -.06, -.02, .35, 0, 0), B("sec", .03, .1, .05, 0, -.1, 0)];
		case 19: return [N("acc", .012, .03, .12, 0, -.04, .04), B("prim", .08, .06, .08, 0, 0, 0)];
		default: return [N("metal", .015, .04, .12, .05, .06, 0), B("prim", .08, .06, .08, 0, 0, 0)];
	}
}
function disposePart(group) {
	group.traverse((o) => {
		if (o instanceof Mesh) o.geometry.dispose();
		if (o instanceof LineSegments) o.geometry.dispose();
	});
}
function buildPart(slotId, variant, paint, edges, theme = "dark", light = null, beamZ = 1, paint2 = null) {
	const pal = getPalette(variant, paint, isVisorSlot(slotId), light, paint2);
	const rec = getRecipe(variant);
	const specs = specsFor(slotId, variant, beamZ);
	const g = new Group();
	g.name = slotId;
	g.userData.slotId = slotId;
	const segs = rec.segs;
	for (const sp of specs) {
		let geo;
		const n = sp.n ?? segs;
		if (sp.t === "box") {
			const [bw, bh, bd] = sp.s;
			const minSide = Math.min(bw, bh, bd);
			if ((rec.quad === "SR" || rec.quad === "RR") && minSide > .03) {
				const radius = Math.min(minSide * (rec.quad === "RR" ? .28 : .16), minSide * .36);
				geo = new RoundedBoxGeometry(bw, bh, bd, rec.quad === "RR" ? 3 : 2, radius);
			} else geo = new BoxGeometry(bw, bh, bd);
		} else if (sp.t === "cyl") {
			const radSegs = sp.n != null ? sp.n : rec.quad === "SS" ? Math.min(8, Math.max(4, segs)) : Math.max(10, segs);
			geo = new CylinderGeometry(sp.s[0], sp.s[1], sp.s[2], radSegs);
		} else if (sp.t === "sph") {
			if (rec.quad === "SS") geo = new OctahedronGeometry(sp.s[0]);
			else geo = new SphereGeometry(sp.s[0], Math.max(12, n), Math.max(10, n - 2));
		} else if (sp.t === "cone") {
			const radSegs = sp.n != null ? sp.n : rec.quad === "SS" ? Math.min(8, Math.max(4, segs)) : Math.max(10, segs);
			geo = new ConeGeometry(sp.s[1] || sp.s[0], sp.s[2], radSegs);
		} else if (sp.t === "torus") geo = new TorusGeometry(sp.s[0], sp.s[1] || .02, rec.quad === "SS" ? 6 : 14, rec.quad === "SS" ? 8 : Math.max(24, n));
		else if (sp.t === "tetra") geo = new TetrahedronGeometry(sp.s[0]);
		else if (sp.t === "octa") geo = new OctahedronGeometry(sp.s[0]);
		else if (sp.t === "dodeca") geo = new DodecahedronGeometry(sp.s[0]);
		else if (sp.t === "icosa") geo = new IcosahedronGeometry(sp.s[0]);
		else if (sp.t === "capsule") geo = new CapsuleGeometry(sp.s[0], sp.s[1], 6, Math.max(16, n));
		else if (sp.t === "knot") geo = new TorusKnotGeometry(sp.s[0], sp.s[1] || .02, 80, 10);
		else if (sp.t === "hemi") geo = new SphereGeometry(sp.s[0], 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
		else if (sp.t === "ring") geo = new TorusGeometry(sp.s[0], sp.s[1] || .015, 12, 32);
		else geo = new BoxGeometry(.1, .1, .1);
		const mesh = new Mesh(geo, pal[sp.m]);
		mesh.position.set(sp.p[0], sp.p[1], sp.p[2]);
		if (sp.r) mesh.rotation.set(sp.r[0], sp.r[1], sp.r[2]);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.userData.slotId = slotId;
		g.add(mesh);
		if (edges) {
			const e = new LineSegments(new EdgesGeometry(geo, 28), getLineMat(theme));
			e.position.copy(mesh.position);
			e.rotation.copy(mesh.rotation);
			e.userData.slotId = slotId;
			e.raycast = () => {};
			g.add(e);
		}
	}
	if (isLeftSlot(slotId) && !slotId.startsWith("extra")) g.scale.x = -1;
	return g;
}
var ZERO = {};
/** Heels together, arms at the sides — 차렷. */
var ATTENTION_POSE = {
	hipR: { px: -.05 },
	hipL: { px: .05 },
	thighR: { px: -.05 },
	thighL: { px: .05 },
	kneeR: { px: -.05 },
	kneeL: { px: .05 },
	shinR: { px: -.05 },
	shinL: { px: .05 },
	ankleR: { px: -.05 },
	ankleL: { px: .05 },
	footR: { px: -.05 },
	footL: { px: .05 },
	shoulderR: { rz: -10 },
	shoulderL: { rz: 10 },
	upperR: { rz: -2 },
	upperL: { rz: 2 },
	handR: { rz: -4 },
	handL: { rz: 4 }
};
/** Shoulder-width stance, arms slightly folded forward into a shooting rest pose. */
var DEFAULT_POSE = {
	helm: {
		rx: 4,
		ry: 6
	},
	visor: { ry: 6 },
	brow: { ry: 6 },
	chestCore: {
		rx: 3,
		ry: 4
	},
	pecR: {
		rx: 2,
		ry: 4
	},
	pecL: {
		rx: 2,
		ry: 4
	},
	abdomen: {
		rx: 2,
		ry: 2
	},
	collar: { ry: 3 },
	pelvis: { py: -.015 },
	pack: { rx: 5 },
	binderR: {
		rz: 6,
		rx: 6
	},
	binderL: {
		rz: -6,
		rx: 6
	},
	hipR: {
		px: .12,
		rz: 7
	},
	hipL: {
		px: -.12,
		rz: -7
	},
	thighR: {
		px: .14,
		rz: 8,
		rx: -8
	},
	thighL: {
		px: -.14,
		rz: -8,
		rx: -6
	},
	kneeR: {
		px: .14,
		rz: 6,
		rx: 6
	},
	kneeL: {
		px: -.14,
		rz: -6,
		rx: 4
	},
	shinR: {
		px: .15,
		rz: 4,
		rx: 8
	},
	shinL: {
		px: -.15,
		rz: -4,
		rx: 6
	},
	ankleR: {
		px: .16,
		rz: 2
	},
	ankleL: {
		px: -.16,
		rz: -2
	},
	footR: { px: .18 },
	footL: { px: -.18 },
	shoulderR: {
		rx: -10,
		rz: -8,
		pz: .02
	},
	upperR: {
		py: .03,
		pz: .08,
		rx: -28,
		rz: -6
	},
	elbowR: {
		py: .06,
		pz: .16,
		rx: -38
	},
	forearmR: {
		py: .1,
		pz: .24,
		rx: -42
	},
	vambraceR: {
		py: .12,
		pz: .28,
		rx: -42
	},
	handR: {
		px: -.04,
		py: .18,
		pz: .34,
		rx: -36,
		ry: 92
	},
	weaponR: {
		py: .16,
		pz: .36
	},
	extra1: {
		pz: .04,
		rx: -8
	},
	extra9: {
		py: .1,
		pz: .26,
		rx: -42
	},
	shoulderL: {
		rx: -8,
		rz: 8,
		pz: .02
	},
	upperL: {
		py: .02,
		pz: .06,
		rx: -22,
		rz: 8
	},
	elbowL: {
		py: .05,
		pz: .14,
		rx: -30
	},
	forearmL: {
		py: .08,
		pz: .2,
		rx: -34
	},
	vambraceL: {
		py: .1,
		pz: .24,
		rx: -34
	},
	handL: {
		px: .03,
		py: .12,
		pz: .28,
		rx: -36,
		ry: -92
	},
	weaponL: {
		py: .1,
		pz: .32
	},
	shield: {
		py: .14,
		pz: .22
	},
	extra2: {
		pz: .03,
		rx: -6
	},
	extra10: {
		py: .08,
		pz: .22,
		rx: -34
	}
};
var POSES = {
	attention: ATTENTION_POSE,
	aim: DEFAULT_POSE
};
function poseOffsetFor(slotId, poseId = "aim") {
	const parts = typeof poseId === "string" ? POSES[poseId] ?? DEFAULT_POSE : poseId;
	if (parts[slotId]) return parts[slotId];
	const src = parts[slotId.replace(/[LR]$/, "")];
	if (!src) return ZERO;
	if (/L$/.test(slotId) || slotId === "weaponL") return {
		px: src.px != null ? -src.px : void 0,
		py: src.py,
		pz: src.pz,
		rx: src.rx,
		ry: src.ry != null ? -src.ry : void 0,
		rz: src.rz != null ? -src.rz : void 0
	};
	return src;
}
var KEY = "frame-mix-build-v10";
var KEY_PREV = "frame-mix-build-v10-prev";
var LEGACY_KEYS = [
	"frame-mix-build-v9",
	"frame-mix-build-v8",
	"frame-mix-build-v7",
	"frame-mix-build-v6",
	"frame-mix-build-v5",
	"frame-mix-build-v4",
	"frame-mix-build-v3",
	"frame-mix-build-v2"
];
var LEGACY_FAM = {
	origin: STYLES[0].id,
	nomad: STYLES[75].id,
	aether: STYLES[25].id,
	fortress: STYLES[24].id,
	pulse: STYLES[50].id,
	chibi: STYLES[99].id
};
function migrateVariant(v, kind) {
	if (LEGACY_FAM[v]) return LEGACY_FAM[v];
	if (EXTRA_LEGACY[v]) return EXTRA_LEGACY[v];
	if (kind === "armor" && !STYLE_BY_ID[v] && v !== "none") return DEFAULT_STYLE;
	return v;
}
function viewport() {
	if (typeof window === "undefined") return {
		w: 1280,
		h: 800
	};
	return {
		w: window.innerWidth || 1280,
		h: window.innerHeight || 800
	};
}
function hangarBox$1() {
	const { w, h } = viewport();
	return {
		w,
		h: Math.max(160, h - 48)
	};
}
function clampPanel(id, rect) {
	const { w: vw, h: vh } = hangarBox$1();
	const capW = id === "adjust" ? 360 : 300;
	const w = Math.min(Math.max(220, rect.w || capW), capW, Math.max(220, vw - 40));
	const maxH = Math.max(160, vh - 40);
	const h = Math.min(Math.max(160, rect.h || maxH), maxH);
	const x = Math.min(Math.max(0, rect.x || 0), Math.max(0, vw - w));
	const y = Math.min(Math.max(0, rect.y || 0), Math.max(0, vh - 36));
	const hFit = Math.min(h, Math.max(160, vh - y));
	return {
		...rect,
		x,
		y,
		w,
		h: hFit
	};
}
function defaultPanels() {
	const { w, h } = hangarBox$1();
	const g = 20;
	const panelH = Math.max(160, h - 40);
	return {
		parts: clampPanel("parts", {
			x: g,
			y: g,
			w: 276,
			h: panelH,
			pinned: false,
			folded: false
		}),
		adjust: clampPanel("adjust", {
			x: Math.max(g, w - 320 - g),
			y: g,
			w: 320,
			h: panelH,
			pinned: false,
			folded: false
		})
	};
}
function restorePanel(id, saved) {
	const def = defaultPanels()[id];
	if (!saved) return def;
	return clampPanel(id, {
		...def,
		...saved
	});
}
function defaultScaleFor(id) {
	if (SLOT_BY_ID[id]?.group === "head" || id === "extra5" || id === "extra7") return {
		sx: .72,
		sy: .72,
		sz: .72
	};
	switch (id) {
		case "collar": return {
			sx: .92,
			sy: .88,
			sz: .92
		};
		case "chestCore": return {
			sx: .9,
			sy: 1.06,
			sz: .94
		};
		case "pecL":
		case "pecR": return {
			sx: .88,
			sy: 1,
			sz: .9
		};
		case "cockpit": return {
			sx: .88,
			sy: 1,
			sz: .88
		};
		case "abdomen": return {
			sx: .86,
			sy: 1.1,
			sz: .9
		};
		case "pelvis": return {
			sx: .9,
			sy: 1,
			sz: .92
		};
		case "skirtF":
		case "skirtB": return {
			sx: .9,
			sy: 1.06,
			sz: .92
		};
		case "skirtL":
		case "skirtR": return {
			sx: .9,
			sy: 1.1,
			sz: .92
		};
		case "shoulderR":
		case "shoulderL": return {
			sx: .88,
			sy: .9,
			sz: .88
		};
		case "upperR":
		case "upperL": return {
			sx: .88,
			sy: 1.14,
			sz: .88
		};
		case "elbowR":
		case "elbowL": return {
			sx: .94,
			sy: .94,
			sz: .94
		};
		case "forearmR":
		case "forearmL": return {
			sx: .88,
			sy: 1.14,
			sz: .88
		};
		case "vambraceR":
		case "vambraceL": return {
			sx: .9,
			sy: 1.04,
			sz: .9
		};
		case "handR":
		case "handL": return {
			sx: .94,
			sy: .94,
			sz: .94
		};
		case "hipR":
		case "hipL": return {
			sx: 1.06,
			sy: 1.06,
			sz: 1.06
		};
		case "thighR":
		case "thighL": return {
			sx: 1.16,
			sy: 1.28,
			sz: 1.16
		};
		case "kneeR":
		case "kneeL": return {
			sx: 1.12,
			sy: 1.08,
			sz: 1.12
		};
		case "shinR":
		case "shinL": return {
			sx: 1.14,
			sy: 1.32,
			sz: 1.14
		};
		case "ankleR":
		case "ankleL": return {
			sx: 1.1,
			sy: 1.06,
			sz: 1.1
		};
		case "footR":
		case "footL": return {
			sx: 1.08,
			sy: 1,
			sz: 1.18
		};
		case "pack": return {
			sx: .9,
			sy: .94,
			sz: .9
		};
		case "thrusterL":
		case "thrusterR": return {
			sx: .92,
			sy: .92,
			sz: .92
		};
		case "binderL":
		case "binderR": return {
			sx: .92,
			sy: .96,
			sz: .92
		};
		default: return {
			sx: 1,
			sy: 1,
			sz: 1
		};
	}
}
function defaultFor(id) {
	const variant = SLOT_BY_ID[id]?.defaultVariant ?? "none";
	return {
		...IDENTITY,
		...defaultScaleFor(id),
		variant,
		paint: null,
		paint2: null,
		visible: variant !== "none"
	};
}
function defaultSlots() {
	const out = {};
	for (const s of SLOTS) out[s.id] = defaultFor(s.id);
	return out;
}
function mirrorTransform(src) {
	return {
		px: -src.px,
		ry: -src.ry,
		rz: -src.rz
	};
}
var GROUP_MIRROR = {
	armR: "armL",
	armL: "armR",
	legR: "legL",
	legL: "legR"
};
function emptyGroupXform() {
	const out = {};
	for (const g of GROUPS) out[g.id] = { ...IDENTITY };
	return out;
}
function restoreGroupXform(raw) {
	const out = emptyGroupXform();
	if (!raw) return out;
	for (const g of GROUPS) {
		const src = raw[g.id];
		if (!src) continue;
		out[g.id] = {
			...IDENTITY,
			...src
		};
	}
	return out;
}
function snapshot(s) {
	return {
		name: s.name,
		slots: s.slots,
		theme: s.theme,
		poseId: s.poseId,
		panels: s.panels,
		light: s.light,
		selected: s.selected,
		explode: s.explode,
		autoRotate: s.autoRotate,
		edges: s.edges,
		symmetry: s.symmetry,
		uniformScale: s.uniformScale,
		groupFilter: s.groupFilter,
		groupXform: s.groupXform
	};
}
function persist(state) {
	try {
		if (typeof window === "undefined") return;
		const blob = JSON.stringify({
			version: 9,
			...state
		});
		const prev = localStorage.getItem(KEY);
		if (prev) localStorage.setItem(KEY_PREV, prev);
		localStorage.setItem(KEY, blob);
	} catch {}
}
function emptySession() {
	return {
		name: "FRAME-00",
		slots: defaultSlots(),
		theme: "light",
		poseId: "aim",
		panels: defaultPanels(),
		light: DEFAULT_VISOR,
		selected: "helm",
		explode: 0,
		autoRotate: false,
		edges: true,
		symmetry: true,
		uniformScale: true,
		groupFilter: "head",
		groupXform: emptyGroupXform()
	};
}
function load() {
	const base = emptySession();
	try {
		if (typeof window === "undefined") return base;
		let raw = localStorage.getItem(KEY);
		if (!raw) for (const k of LEGACY_KEYS) {
			raw = localStorage.getItem(k);
			if (raw) break;
		}
		if (!raw) return base;
		const parsed = JSON.parse(raw);
		const slots = defaultSlots();
		if (parsed.slots) {
			for (const def of SLOTS) {
				const src = parsed.slots[def.id];
				if (!src) continue;
				slots[def.id] = {
					...slots[def.id],
					...src,
					variant: migrateVariant(src.variant, def.kind),
					paint2: src.paint2 ?? null
				};
			}
			if ((parsed.version ?? 0) < 9) for (const id of Object.keys(slots)) {
				const cur = slots[id];
				if (!cur) continue;
				if (cur.sx === 1 && cur.sy === 1 && cur.sz === 1) slots[id] = {
					...cur,
					...defaultScaleFor(id)
				};
			}
		}
		return {
			name: parsed.name || base.name,
			slots,
			theme: parsed.theme === "dark" ? "dark" : "light",
			poseId: parsed.poseId || "aim",
			light: parsed.light || parsed.slots?.visor?.paint || "#79d7ff",
			panels: {
				parts: restorePanel("parts", parsed.panels?.parts),
				adjust: restorePanel("adjust", parsed.panels?.adjust)
			},
			selected: parsed.selected && SLOT_BY_ID[parsed.selected] ? parsed.selected : base.selected,
			explode: typeof parsed.explode === "number" ? parsed.explode : 0,
			autoRotate: parsed.autoRotate === true,
			edges: parsed.edges !== false,
			symmetry: parsed.symmetry !== false,
			uniformScale: parsed.uniformScale !== false,
			groupFilter: parsed.groupFilter || SLOT_BY_ID[parsed.selected ?? ""]?.group || "head",
			groupXform: restoreGroupXform(parsed.groupXform)
		};
	} catch {
		return base;
	}
}
var saveTimer = null;
function scheduleSave(get) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => persist(snapshot(get())), 400);
}
var initial = load();
var useStudio = create((set, get) => ({
	name: initial.name,
	slots: initial.slots,
	selected: initial.selected,
	explode: initial.explode,
	autoRotate: initial.autoRotate,
	edges: initial.edges,
	symmetry: initial.symmetry,
	uniformScale: initial.uniformScale,
	groupFilter: initial.groupFilter,
	groupXform: initial.groupXform,
	theme: initial.theme,
	poseId: initial.poseId,
	panels: initial.panels,
	light: initial.light,
	panelZ: ["parts", "adjust"],
	camTick: 0,
	detailsTick: 0,
	poseMenu: null,
	setSelected: (id) => {
		set({
			selected: id,
			groupFilter: SLOT_BY_ID[id]?.group ?? get().groupFilter
		});
		scheduleSave(get);
	},
	pickSlot: (id) => {
		const def = SLOT_BY_ID[id];
		set((st) => {
			const panels = { ...st.panels };
			if (panels.adjust?.folded) panels.adjust = {
				...panels.adjust,
				folded: false
			};
			return {
				selected: id,
				groupFilter: def?.group ?? st.groupFilter,
				panels,
				panelZ: [...st.panelZ.filter((x) => x !== "adjust"), "adjust"],
				detailsTick: st.detailsTick + 1
			};
		});
		scheduleSave(get);
	},
	setGroupFilter: (g) => {
		set({ groupFilter: g });
		scheduleSave(get);
	},
	patchSlot: (id, patch, fromMirror) => {
		set((st) => {
			const cur = st.slots[id];
			if (!cur) return st;
			let next = {
				...cur,
				...patch
			};
			if (st.uniformScale && (patch.sx != null || patch.sy != null || patch.sz != null)) {
				const explicitAll = patch.sx != null && patch.sy != null && patch.sz != null;
				if (!(BEAM_MELEE.has(next.variant) && patch.sz != null && patch.sx == null && patch.sy == null) && !explicitAll) {
					const v = patch.sx ?? patch.sy ?? patch.sz ?? cur.sx;
					next = {
						...next,
						sx: v,
						sy: v,
						sz: v
					};
				}
			}
			const slots = {
				...st.slots,
				[id]: next
			};
			if (st.symmetry && !fromMirror) {
				const other = SLOT_BY_ID[id]?.mirror;
				if (other && slots[other]) slots[other] = {
					...slots[other],
					...patch,
					...mirrorTransform(next),
					variant: next.variant,
					paint: next.paint,
					paint2: next.paint2,
					visible: next.visible,
					sx: next.sx,
					sy: next.sy,
					sz: next.sz
				};
			}
			return { slots };
		});
		scheduleSave(get);
	},
	setVariant: (id, variant) => {
		get().patchSlot(id, {
			variant,
			visible: variant !== "none"
		});
	},
	applyFamily: (family, group) => {
		set((st) => {
			const slots = { ...st.slots };
			for (const def of SLOTS) {
				if (group && def.group !== group) continue;
				if (def.kind !== "armor") continue;
				if (!def.variants.some((v) => v.id === family)) continue;
				slots[def.id] = {
					...slots[def.id],
					variant: family,
					visible: true
				};
			}
			return { slots };
		});
		scheduleSave(get);
	},
	applyPaint: (hex, group) => {
		set((st) => {
			const slots = { ...st.slots };
			for (const def of SLOTS) {
				if (group && def.group !== group) continue;
				if (isVisorSlot(def.id)) continue;
				if (!slots[def.id]) continue;
				slots[def.id] = {
					...slots[def.id],
					paint: hex
				};
			}
			return { slots };
		});
		scheduleSave(get);
	},
	applyPaint2: (hex, group) => {
		set((st) => {
			const slots = { ...st.slots };
			for (const def of SLOTS) {
				if (group && def.group !== group) continue;
				if (!slots[def.id]) continue;
				slots[def.id] = {
					...slots[def.id],
					paint2: hex
				};
			}
			return { slots };
		});
		scheduleSave(get);
	},
	applyVisorPaint: (hex, group) => {
		set((st) => {
			const slots = { ...st.slots };
			for (const def of SLOTS) {
				if (!isVisorSlot(def.id)) continue;
				if (group && def.group !== group) continue;
				if (!slots[def.id]) continue;
				slots[def.id] = {
					...slots[def.id],
					paint: hex
				};
			}
			return {
				slots,
				light: group ? st.light : hex
			};
		});
		scheduleSave(get);
	},
	setLight: (hex) => {
		set({ light: hex });
		scheduleSave(get);
	},
	randomMix: () => {
		set((st) => {
			const slots = { ...st.slots };
			for (const def of SLOTS) {
				if (def.kind === "extra" && Math.random() < .55) {
					slots[def.id] = {
						...slots[def.id],
						variant: "none",
						visible: false
					};
					continue;
				}
				const pool = def.variants.filter((v) => v.id !== "none");
				const pick = pool[Math.floor(Math.random() * pool.length)] ?? def.variants[0];
				slots[def.id] = {
					...defaultFor(def.id),
					variant: pick.id,
					visible: pick.id !== "none"
				};
			}
			if (st.symmetry) for (const def of SLOTS) {
				if (!def.mirror) continue;
				if (isLeftSlot(def.id) && slots[def.mirror]) {
					const src = slots[def.mirror];
					slots[def.id] = {
						...src,
						...mirrorTransform(src)
					};
				}
			}
			return { slots };
		});
		scheduleSave(get);
	},
	resetTransforms: () => {
		set((st) => {
			const slots = { ...st.slots };
			for (const id of Object.keys(slots)) slots[id] = {
				...slots[id],
				px: 0,
				py: 0,
				pz: 0,
				rx: 0,
				ry: 0,
				rz: 0,
				...defaultScaleFor(id)
			};
			return { slots };
		});
		scheduleSave(get);
	},
	resetAll: () => {
		set({
			name: "FRAME-00",
			slots: defaultSlots(),
			selected: "helm",
			poseId: "aim",
			light: DEFAULT_VISOR,
			groupXform: emptyGroupXform()
		});
		scheduleSave(get);
	},
	resetSlotDefault: (id) => {
		get().patchSlot(id, defaultFor(id));
	},
	resetGroupDefault: (group) => {
		set((st) => {
			const slots = { ...st.slots };
			for (const def of SLOTS) {
				if (def.group !== group) continue;
				slots[def.id] = defaultFor(def.id);
			}
			const groupXform = {
				...st.groupXform,
				[group]: { ...IDENTITY }
			};
			const pair = GROUP_MIRROR[group];
			if (st.symmetry && pair) groupXform[pair] = { ...IDENTITY };
			return {
				slots,
				groupXform
			};
		});
		scheduleSave(get);
	},
	setGroupVisible: (group, visible) => {
		set((st) => {
			const slots = { ...st.slots };
			for (const def of SLOTS) {
				if (def.group !== group) continue;
				if (!slots[def.id]) continue;
				slots[def.id] = {
					...slots[def.id],
					visible
				};
			}
			return { slots };
		});
		scheduleSave(get);
	},
	patchGroupXform: (group, patch) => {
		set((st) => {
			const cur = st.groupXform[group] ?? { ...IDENTITY };
			let next = {
				...cur,
				...patch
			};
			if (st.uniformScale && (patch.sx != null || patch.sy != null || patch.sz != null)) {
				if (!(patch.sx != null && patch.sy != null && patch.sz != null)) {
					const v = patch.sx ?? patch.sy ?? patch.sz ?? cur.sx;
					next = {
						...next,
						sx: v,
						sy: v,
						sz: v
					};
				}
			}
			const groupXform = {
				...st.groupXform,
				[group]: next
			};
			const pair = GROUP_MIRROR[group];
			if (st.symmetry && pair) groupXform[pair] = {
				...next,
				px: -next.px,
				ry: -next.ry,
				rz: -next.rz
			};
			return { groupXform };
		});
		scheduleSave(get);
	},
	resetGroupXform: (group, keys) => {
		set((st) => {
			const next = { ...st.groupXform[group] ?? { ...IDENTITY } };
			const resetKeys = keys ?? Object.keys(IDENTITY);
			for (const k of resetKeys) next[k] = IDENTITY[k];
			const groupXform = {
				...st.groupXform,
				[group]: next
			};
			const pair = GROUP_MIRROR[group];
			if (st.symmetry && pair) groupXform[pair] = {
				...next,
				px: -next.px,
				ry: -next.ry,
				rz: -next.rz
			};
			return { groupXform };
		});
		scheduleSave(get);
	},
	setExplode: (v) => {
		set({ explode: v });
		scheduleSave(get);
	},
	toggle: (k) => {
		set((st) => ({ [k]: !st[k] }));
		scheduleSave(get);
	},
	setName: (n) => {
		set({ name: n });
		scheduleSave(get);
	},
	setTheme: (t) => {
		set({ theme: t });
		scheduleSave(get);
	},
	setPose: (id) => {
		set({ poseId: id });
		scheduleSave(get);
	},
	openPoseMenu: (x, y) => {
		set({ poseMenu: {
			x,
			y
		} });
	},
	closePoseMenu: () => {
		if (get().poseMenu) set({ poseMenu: null });
	},
	setPanel: (id, patch) => {
		set((st) => {
			const next = {
				...st.panels[id],
				...patch
			};
			return { panels: {
				...st.panels,
				[id]: clampPanel(id, next)
			} };
		});
		scheduleSave(get);
	},
	resetPanels: () => {
		set({ panels: defaultPanels() });
		scheduleSave(get);
	},
	showAllParts: () => {
		set((st) => {
			const slots = { ...st.slots };
			for (const id of Object.keys(slots)) {
				const cur = slots[id];
				if (!cur) continue;
				slots[id] = {
					...cur,
					visible: cur.variant !== "none"
				};
			}
			return { slots };
		});
		scheduleSave(get);
	},
	hideAllParts: () => {
		set((st) => {
			const slots = { ...st.slots };
			for (const id of Object.keys(slots)) {
				const cur = slots[id];
				if (!cur) continue;
				slots[id] = {
					...cur,
					visible: false
				};
			}
			return { slots };
		});
		scheduleSave(get);
	},
	refreshAll: () => {
		set((st) => {
			const slots = { ...st.slots };
			for (const id of Object.keys(slots)) {
				const cur = slots[id];
				if (!cur) continue;
				slots[id] = {
					...cur,
					visible: cur.variant !== "none"
				};
			}
			return {
				slots,
				panels: defaultPanels(),
				groupXform: emptyGroupXform(),
				explode: 0,
				camTick: st.camTick + 1
			};
		});
		scheduleSave(get);
	},
	resetCamera: () => set((st) => ({ camTick: st.camTick + 1 })),
	focusPanel: (id) => set((st) => ({ panelZ: [...st.panelZ.filter((x) => x !== id), id] })),
	saveNow: () => {
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
		}
		persist(snapshot(get()));
	},
	rehydrate: () => {
		set(load());
	},
	exportJson: () => {
		const s = get();
		return JSON.stringify({
			version: 9,
			name: s.name,
			slots: s.slots,
			theme: s.theme,
			poseId: s.poseId,
			light: s.light
		}, null, 2);
	},
	importJson: (raw) => {
		try {
			const parsed = JSON.parse(raw);
			const slots = defaultSlots();
			if (parsed.slots) for (const def of SLOTS) {
				const src = parsed.slots[def.id];
				if (!src) continue;
				slots[def.id] = {
					...slots[def.id],
					...src,
					variant: migrateVariant(src.variant, def.kind),
					paint2: src.paint2 ?? null
				};
			}
			set({
				name: parsed.name || get().name,
				slots,
				theme: parsed.theme === "dark" ? "dark" : get().theme,
				poseId: parsed.poseId || get().poseId,
				light: parsed.light || parsed.slots?.visor?.paint || get().light
			});
			scheduleSave(get);
			return true;
		} catch {
			return false;
		}
	}
}));
function SlotMesh({ id, variant, paint, paint2, light, edges, theme, beamZ }) {
	const group = (0, import_react.useMemo)(() => buildPart(id, variant, paint, edges, theme, light, beamZ, paint2), [
		id,
		variant,
		paint,
		paint2,
		light,
		edges,
		theme,
		beamZ
	]);
	(0, import_react.useEffect)(() => () => disposePart(group), [group]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("primitive", { object: group });
}
function MechRig() {
	const slots = useStudio((s) => s.slots);
	const groupXform = useStudio((s) => s.groupXform);
	const explode = useStudio((s) => s.explode);
	const edges = useStudio((s) => s.edges);
	const theme = useStudio((s) => s.theme);
	const poseId = useStudio((s) => s.poseId);
	const light = useStudio((s) => s.light) || slots.visor?.paint || "#79d7ff";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", { children: GROUPS.map((g) => {
		const pivot = SLOT_BY_ID[GROUP_ROOT[g.id]]?.socket ?? [
			0,
			0,
			0
		];
		const gx = groupXform[g.id];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
			position: [
				pivot[0] + (gx?.px ?? 0),
				pivot[1] + (gx?.py ?? 0),
				pivot[2] + (gx?.pz ?? 0)
			],
			rotation: [
				(gx?.rx ?? 0) * Math.PI / 180,
				(gx?.ry ?? 0) * Math.PI / 180,
				(gx?.rz ?? 0) * Math.PI / 180
			],
			scale: [
				gx?.sx ?? 1,
				gx?.sy ?? 1,
				gx?.sz ?? 1
			],
			children: SLOTS.filter((def) => def.group === g.id).map((def) => {
				const st = slots[def.id];
				if (!st || !st.visible || st.variant === "none") return null;
				const [dx, dy, dz] = explodeDir(def.socket);
				const k = explode * .85;
				const pose = poseOffsetFor(def.id, poseId);
				const beam = BEAM_MELEE.has(st.variant);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
					userData: { slotId: def.id },
					position: [
						def.socket[0] - pivot[0] + st.px + (pose.px ?? 0) + dx * k,
						def.socket[1] - pivot[1] + st.py + (pose.py ?? 0) + dy * k,
						def.socket[2] - pivot[2] + st.pz + (pose.pz ?? 0) + dz * k
					],
					rotation: [
						(st.rx + (pose.rx ?? 0)) * Math.PI / 180,
						(st.ry + (pose.ry ?? 0)) * Math.PI / 180,
						(st.rz + (pose.rz ?? 0)) * Math.PI / 180
					],
					scale: [
						st.sx,
						st.sy,
						beam ? 1 : st.sz
					],
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotMesh, {
						id: def.id,
						variant: st.variant,
						paint: st.paint,
						paint2: st.paint2 ?? null,
						light,
						edges,
						theme,
						beamZ: beam ? st.sz : 1
					})
				}, def.id);
			})
		}, g.id);
	}) });
}
function slotIdOf(obj) {
	let o = obj;
	while (o) {
		const id = o.userData?.slotId;
		if (id) return id;
		o = o.parent;
	}
}
var _box = new Box3();
var _size = new Vector3();
function slotVolume(obj) {
	let root = obj;
	const id = slotIdOf(obj);
	while (root.parent && slotIdOf(root.parent) === id) root = root.parent;
	_box.setFromObject(root);
	_box.getSize(_size);
	return Math.max(8e-4, _size.x) * Math.max(8e-4, _size.y) * Math.max(8e-4, _size.z);
}
function pickSlotAt(scene, camera, ndc) {
	const raycaster = new Raycaster();
	raycaster.setFromCamera(ndc, camera);
	const hits = raycaster.intersectObject(scene, true);
	const best = /* @__PURE__ */ new Map();
	for (const h of hits) {
		if (!(h.object instanceof Mesh)) continue;
		const id = slotIdOf(h.object);
		if (!id) continue;
		const prev = best.get(id);
		if (prev && prev.dist <= h.distance) continue;
		best.set(id, {
			id,
			dist: h.distance,
			vol: slotVolume(h.object)
		});
	}
	if (!best.size) return null;
	const list = [...best.values()];
	const nearest = Math.min(...list.map((c) => c.dist));
	const nearby = list.filter((c) => c.dist <= nearest + .16);
	nearby.sort((a, b) => a.vol - b.vol || a.dist - b.dist);
	return nearby[0]?.id ?? null;
}
function ndcFromEvent(el, ev, out) {
	const rect = el.getBoundingClientRect();
	out.set((ev.clientX - rect.left) / rect.width * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
	return out;
}
function PartPicker() {
	const camera = useThree((s) => s.camera);
	const gl = useThree((s) => s.gl);
	const scene = useThree((s) => s.scene);
	const ndc = (0, import_react.useMemo)(() => new Vector2(), []);
	(0, import_react.useEffect)(() => {
		const el = gl.domElement;
		const onDbl = (ev) => {
			ndcFromEvent(el, ev, ndc);
			const id = pickSlotAt(scene, camera, ndc);
			if (id) {
				useStudio.getState().closePoseMenu();
				useStudio.getState().pickSlot(id);
				return;
			}
			const rect = el.getBoundingClientRect();
			useStudio.getState().openPoseMenu(ev.clientX - rect.left, ev.clientY - rect.top);
		};
		const onPointerDown = (ev) => {
			if (ev.detail >= 2) return;
			if (!useStudio.getState().poseMenu) return;
			ndcFromEvent(el, ev, ndc);
			if (pickSlotAt(scene, camera, ndc)) return;
			useStudio.getState().closePoseMenu();
		};
		const onMove = (ev) => {
			ndcFromEvent(el, ev, ndc);
			const id = pickSlotAt(scene, camera, ndc);
			el.style.cursor = id ? "pointer" : "";
		};
		el.addEventListener("dblclick", onDbl);
		el.addEventListener("pointerdown", onPointerDown);
		el.addEventListener("pointermove", onMove);
		return () => {
			el.removeEventListener("dblclick", onDbl);
			el.removeEventListener("pointerdown", onPointerDown);
			el.removeEventListener("pointermove", onMove);
			el.style.cursor = "";
		};
	}, [
		camera,
		gl,
		scene,
		ndc
	]);
	return null;
}
function Lights({ theme }) {
	if (theme === "light") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hemisphereLight", { args: [
			"#f4f1ea",
			"#c8c2b6",
			.85
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				4.5,
				8,
				5
			],
			intensity: 1.35,
			castShadow: true,
			"shadow-mapSize-width": 2048,
			"shadow-mapSize-height": 2048,
			"shadow-bias": -2e-4,
			"shadow-camera-near": 1,
			"shadow-camera-far": 22,
			"shadow-camera-left": -4,
			"shadow-camera-right": 4,
			"shadow-camera-top": 4,
			"shadow-camera-bottom": -4
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				-5,
				3,
				-2
			],
			intensity: .35,
			color: "#9aa8b8"
		})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hemisphereLight", { args: [
			"#cfd4dc",
			"#1a1c20",
			.55
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				4.5,
				8,
				5
			],
			intensity: 1.5,
			castShadow: true,
			"shadow-mapSize-width": 2048,
			"shadow-mapSize-height": 2048,
			"shadow-bias": -2e-4,
			"shadow-camera-near": 1,
			"shadow-camera-far": 22,
			"shadow-camera-left": -4,
			"shadow-camera-right": 4,
			"shadow-camera-top": 4,
			"shadow-camera-bottom": -4
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				-5,
				3,
				-2
			],
			intensity: .45,
			color: "#9aa8b8"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				0,
				2,
				6
			],
			intensity: .25,
			color: "#e8e6e1"
		})
	] });
}
function StudioEnv() {
	const scene = useThree((s) => s.scene);
	const gl = useThree((s) => s.gl);
	(0, import_react.useEffect)(() => {
		gl.toneMapping = 4;
		gl.toneMappingExposure = 1.08;
		gl.outputColorSpace = SRGBColorSpace;
		gl.shadowMap.enabled = true;
		gl.shadowMap.type = 2;
		const room = new RoomEnvironment();
		const pmrem = new PMREMGenerator(gl);
		const tex = pmrem.fromScene(room, .04).texture;
		scene.environment = tex;
		scene.environmentIntensity = .62;
		room.dispose();
		return () => {
			scene.environment = null;
			tex.dispose();
			pmrem.dispose();
		};
	}, [scene, gl]);
	return null;
}
function CaptureBridge() {
	const gl = useThree((s) => s.gl);
	(0, import_react.useEffect)(() => {
		window.__frameMixCapture = () => gl.domElement.toDataURL("image/png");
		return () => {
			delete window.__frameMixCapture;
		};
	}, [gl]);
	return null;
}
function CameraHome({ tick }) {
	const camera = useThree((s) => s.camera);
	const controls = useThree((s) => s.controls);
	(0, import_react.useEffect)(() => {
		if (tick === 0) return;
		camera.position.set(2.4, 1.6, 3.4);
		camera.lookAt(0, 1.05, 0);
		controls?.target?.set(0, 1.05, 0);
		controls?.update?.();
	}, [
		tick,
		camera,
		controls
	]);
	return null;
}
function HangarCanvas() {
	const autoRotate = useStudio((s) => s.autoRotate);
	const theme = useStudio((s) => s.theme);
	const camTick = useStudio((s) => s.camTick);
	const bg = theme === "light" ? "#f4f1ea" : "#0b0c0e";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Canvas, {
		shadows: true,
		dpr: [1, 2],
		camera: {
			position: [
				2.4,
				1.6,
				3.4
			],
			fov: 38,
			near: .1,
			far: 50
		},
		gl: {
			antialias: true,
			preserveDrawingBuffer: true,
			toneMapping: 4
		},
		onCreated: ({ gl }) => {
			gl.toneMapping = 4;
			gl.toneMappingExposure = 1.08;
			gl.shadowMap.type = 2;
		},
		className: "h-full w-full touch-none bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("color", {
				attach: "background",
				args: [bg]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("fog", {
				attach: "fog",
				args: [
					bg,
					9,
					20
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Suspense, {
				fallback: null,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lights, { theme }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioEnv, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MechRig, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartPicker, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid, {
						args: [12, 12],
						cellSize: .25,
						sectionSize: 1,
						cellColor: theme === "light" ? "#ddd6c8" : "#1c1e22",
						sectionColor: theme === "light" ? "#c9c1b2" : "#2a2d33",
						fadeDistance: 10,
						fadeStrength: 1.4,
						position: [
							0,
							0,
							0
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactShadows, {
						position: [
							0,
							.001,
							0
						],
						opacity: theme === "light" ? .28 : .45,
						scale: 8,
						blur: 2.2,
						far: 2.5
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptureBridge, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraHome, { tick: camTick })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitControls, {
				makeDefault: true,
				enableDamping: true,
				dampingFactor: .08,
				autoRotate,
				autoRotateSpeed: .6,
				minDistance: 1.4,
				maxDistance: 8,
				minPolarAngle: .2,
				maxPolarAngle: Math.PI / 2 - .04,
				target: [
					0,
					1.05,
					0
				]
			})
		]
	});
}
function fmt(value, step) {
	if (step >= 1) return String(Math.round(value));
	const digits = step <= .005 ? 3 : 2;
	return value.toFixed(digits);
}
function SliderRow({ label, value, min, max, step, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid grid-cols-[1.5rem_minmax(0,1fr)_4.75rem] items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				min,
				max,
				step,
				value,
				onChange: (e) => onChange(Number(e.target.value)),
				className: "h-8 w-full accent-fg"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "text",
				inputMode: "decimal",
				className: "h-8 min-w-0 rounded-sm border border-border bg-elevated px-1.5 font-mono text-xs tabular-nums text-fg",
				value: fmt(value, step),
				onChange: (e) => {
					const n = Number(e.target.value);
					if (Number.isFinite(n)) onChange(n);
				},
				onBlur: (e) => {
					const n = Number(e.target.value);
					if (!Number.isFinite(n)) e.currentTarget.value = fmt(value, step);
				}
			})
		]
	});
}
function ColorBar({ label, value, min, max, step, gradient, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid grid-cols-[1.5rem_minmax(0,1fr)_4.75rem] items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				min,
				max,
				step,
				value,
				onChange: (e) => onChange(Number(e.target.value)),
				className: "hsb-bar w-full",
				style: { backgroundImage: gradient }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "text",
				inputMode: "decimal",
				className: "h-8 min-w-0 rounded-sm border border-border bg-elevated px-1.5 font-mono text-xs tabular-nums text-fg",
				value: fmt(value, step),
				onChange: (e) => {
					const n = Number(e.target.value);
					if (Number.isFinite(n)) onChange(n);
				}
			})
		]
	});
}
function AxisSliders({ title, x, y, z, min, max, step, onChange, onReset }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wide text-muted",
					children: title
				}), onReset && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onReset,
					"aria-label": `Reset ${title}`,
					className: "inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-3.5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
				label: "X",
				value: x,
				min,
				max,
				step,
				onChange: (v) => onChange("x", v)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
				label: "Y",
				value: y,
				min,
				max,
				step,
				onChange: (v) => onChange("y", v)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
				label: "Z",
				value: z,
				min,
				max,
				step,
				onChange: (v) => onChange("z", v)
			})
		]
	});
}
function hueBar() {
	return `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) => hsbToHex(i * 30, 100, 100)).join(",")})`;
}
function HsbSliders({ title, hex, onChange }) {
	const { h, s, b } = hexToHsb(hex);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-2 space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wide text-muted",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-5 rounded-md border border-[#c4bfb6]",
					style: { background: hex }
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorBar, {
				label: "H",
				value: h,
				min: 0,
				max: 360,
				step: 1,
				gradient: hueBar(),
				onChange: (v) => onChange(hsbToHex(v, s, b))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorBar, {
				label: "S",
				value: s,
				min: 0,
				max: 100,
				step: 1,
				gradient: `linear-gradient(to right, ${hsbToHex(h, 0, b)}, ${hsbToHex(h, 100, b)})`,
				onChange: (v) => onChange(hsbToHex(h, v, b))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorBar, {
				label: "B",
				value: b,
				min: 0,
				max: 100,
				step: 1,
				gradient: `linear-gradient(to right, #000000, ${hsbToHex(h, s, 100)})`,
				onChange: (v) => onChange(hsbToHex(h, s, v))
			})
		]
	});
}
function hangarBox() {
	const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
	const vh = typeof window === "undefined" ? 800 : window.innerHeight;
	return {
		w: vw,
		h: Math.max(160, vh - 48)
	};
}
function clampPos(x, y, w) {
	const { w: vw, h: vh } = hangarBox();
	return {
		x: Math.min(Math.max(0, vw - w), Math.max(0, x)),
		y: Math.min(Math.max(0, vh - 36), Math.max(0, y))
	};
}
function FloatPanel({ title, rect, z, onChange, onReset, onFocus, children, extra }) {
	const drag = (0, import_react.useRef)(null);
	const resize = (0, import_react.useRef)(null);
	if (rect.folded) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => {
			onFocus();
			onChange({ folded: false });
		},
		className: "absolute z-20 h-8 rounded-sm border border-border bg-elevated/95 px-3 text-xs text-fg shadow-sm",
		style: {
			left: rect.x,
			top: rect.y
		},
		children: title
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "absolute flex flex-col overflow-hidden rounded-md border border-border bg-elevated/95 shadow-sm backdrop-blur-sm",
		style: {
			left: rect.x,
			top: rect.y,
			width: rect.w,
			height: rect.h,
			zIndex: z,
			maxWidth: "100%",
			maxHeight: "100%"
		},
		onPointerDown: onFocus,
		onWheel: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: cn("flex h-9 shrink-0 items-center gap-1 border-b border-border px-2", rect.pinned ? "cursor-default" : "cursor-grab active:cursor-grabbing"),
				onPointerDown: (e) => {
					if (rect.pinned) return;
					if (e.target.closest("button")) return;
					e.currentTarget.setPointerCapture(e.pointerId);
					drag.current = {
						mx: e.clientX,
						my: e.clientY,
						x: rect.x,
						y: rect.y
					};
				},
				onPointerMove: (e) => {
					if (!drag.current) return;
					onChange(clampPos(drag.current.x + (e.clientX - drag.current.mx), drag.current.y + (e.clientY - drag.current.my), rect.w));
				},
				onPointerUp: () => {
					drag.current = null;
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 truncate text-xs font-medium tracking-wide",
						children: title
					}),
					extra,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg",
						"aria-label": rect.pinned ? "Unpin" : "Pin",
						onClick: () => onChange({ pinned: !rect.pinned }),
						children: rect.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinOff, { className: "size-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg",
						"aria-label": "Reset position",
						onClick: onReset,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-hidden",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-2 shrink-0 cursor-ns-resize bg-transparent hover:bg-surface",
				onPointerDown: (e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					resize.current = {
						my: e.clientY,
						h: rect.h
					};
				},
				onPointerMove: (e) => {
					if (!resize.current) return;
					const { h: vh } = hangarBox();
					const next = resize.current.h + (e.clientY - resize.current.my);
					onChange({ h: Math.min(Math.max(160, next), Math.max(160, vh - rect.y)) });
				},
				onPointerUp: () => {
					resize.current = null;
				}
			})
		]
	});
}
function useClient() {
	return (0, import_react.useSyncExternalStore)(() => () => {}, () => true, () => false);
}
function useLg() {
	return (0, import_react.useSyncExternalStore)((cb) => {
		window.addEventListener("resize", cb);
		return () => window.removeEventListener("resize", cb);
	}, () => window.innerWidth >= 1024, () => false);
}
var EXTRA_CHIPS = [
	{
		id: "all",
		label: "All"
	},
	{
		id: "M",
		label: "Module"
	},
	{
		id: "W",
		label: "Weapon"
	},
	{
		id: "A",
		label: "Accent"
	},
	{
		id: "G",
		label: "Shape"
	}
];
function Studio() {
	const mounted = useClient();
	const lg = useLg();
	const [mobilePane, setMobilePane] = (0, import_react.useState)("adjust");
	const [quad, setQuad] = (0, import_react.useState)("all");
	const [extraClass, setExtraClass] = (0, import_react.useState)("all");
	const name = useStudio((s) => s.name);
	const setName = useStudio((s) => s.setName);
	const selected = useStudio((s) => s.selected);
	const slots = useStudio((s) => s.slots);
	const groupFilter = useStudio((s) => s.groupFilter);
	const setGroupFilter = useStudio((s) => s.setGroupFilter);
	const setSelected = useStudio((s) => s.setSelected);
	const setVariant = useStudio((s) => s.setVariant);
	const patchSlot = useStudio((s) => s.patchSlot);
	const applyFamily = useStudio((s) => s.applyFamily);
	const applyPaint = useStudio((s) => s.applyPaint);
	const applyPaint2 = useStudio((s) => s.applyPaint2);
	const applyVisorPaint = useStudio((s) => s.applyVisorPaint);
	const light = useStudio((s) => s.light);
	const setLight = useStudio((s) => s.setLight);
	const randomMix = useStudio((s) => s.randomMix);
	const resetSlotDefault = useStudio((s) => s.resetSlotDefault);
	const resetGroupDefault = useStudio((s) => s.resetGroupDefault);
	const setGroupVisible = useStudio((s) => s.setGroupVisible);
	const groupXform = useStudio((s) => s.groupXform);
	const patchGroupXform = useStudio((s) => s.patchGroupXform);
	const resetGroupXform = useStudio((s) => s.resetGroupXform);
	const explode = useStudio((s) => s.explode);
	const setExplode = useStudio((s) => s.setExplode);
	const autoRotate = useStudio((s) => s.autoRotate);
	const edges = useStudio((s) => s.edges);
	const symmetry = useStudio((s) => s.symmetry);
	const uniformScale = useStudio((s) => s.uniformScale);
	const toggle = useStudio((s) => s.toggle);
	const exportJson = useStudio((s) => s.exportJson);
	const importJson = useStudio((s) => s.importJson);
	const saveNow = useStudio((s) => s.saveNow);
	const rehydrate = useStudio((s) => s.rehydrate);
	const theme = useStudio((s) => s.theme);
	const setTheme = useStudio((s) => s.setTheme);
	const panels = useStudio((s) => s.panels);
	const setPanel = useStudio((s) => s.setPanel);
	const showAllParts = useStudio((s) => s.showAllParts);
	const hideAllParts = useStudio((s) => s.hideAllParts);
	const refreshAll = useStudio((s) => s.refreshAll);
	const resetCamera = useStudio((s) => s.resetCamera);
	const focusPanel = useStudio((s) => s.focusPanel);
	const panelZ = useStudio((s) => s.panelZ);
	const detailsTick = useStudio((s) => s.detailsTick);
	const poseId = useStudio((s) => s.poseId);
	const setPose = useStudio((s) => s.setPose);
	const poseMenu = useStudio((s) => s.poseMenu);
	const closePoseMenu = useStudio((s) => s.closePoseMenu);
	(0, import_react.useEffect)(() => {
		document.documentElement.classList.toggle("theme-light", theme === "light");
		document.documentElement.classList.toggle("theme-dark", theme === "dark");
	}, [theme]);
	(0, import_react.useEffect)(() => {
		rehydrate();
		const flush = () => useStudio.getState().saveNow();
		const onHide = () => {
			if (document.visibilityState === "hidden") flush();
		};
		window.addEventListener("beforeunload", flush);
		document.addEventListener("visibilitychange", onHide);
		const onResize = () => {
			const cur = useStudio.getState().panels;
			for (const id of Object.keys(cur)) {
				const rect = cur[id];
				if (!rect) continue;
				useStudio.getState().setPanel(id, clampPanel(id, rect));
			}
		};
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("beforeunload", flush);
			document.removeEventListener("visibilitychange", onHide);
			window.removeEventListener("resize", onResize);
		};
	}, [rehydrate]);
	(0, import_react.useEffect)(() => {
		if (!detailsTick) return;
		setMobilePane("adjust");
	}, [detailsTick]);
	(0, import_react.useEffect)(() => {
		if (!poseMenu) return;
		const onKey = (e) => {
			if (e.key === "Escape") closePoseMenu();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [poseMenu, closePoseMenu]);
	const def = SLOT_BY_ID[selected];
	const st = slots[selected];
	const groupSlots = SLOTS.filter((s) => s.group === groupFilter);
	const groupVisible = groupSlots.some((s) => slots[s.id]?.visible);
	const gx = groupXform[groupFilter] ?? {
		px: 0,
		py: 0,
		pz: 0,
		rx: 0,
		ry: 0,
		rz: 0,
		sx: 1,
		sy: 1,
		sz: 1
	};
	const anyVisible = Object.values(slots).some((s) => s.visible);
	const filteredStyles = (0, import_react.useMemo)(() => {
		return STYLES.filter((s) => {
			if (quad === "all") return true;
			const q = QUAD_RANGES.find((r) => r.id === quad);
			if (q && (s.serial < q.from || s.serial > q.to)) return false;
			return true;
		});
	}, [quad]);
	const zOf = (id) => 30 + panelZ.indexOf(id);
	const stylePicker = def && st && def.kind === "armor" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StylePicker, {
		current: st.variant,
		filtered: filteredStyles,
		quad,
		onQuad: setQuad,
		onPick: (id) => setVariant(selected, id),
		onApplyAll: (id) => applyFamily(id),
		onApplyGroup: (id) => applyFamily(id, groupFilter)
	});
	const otherPicker = def && st && def.kind !== "armor" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [def.kind === "extra" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-2 flex flex-wrap gap-1",
		children: EXTRA_CHIPS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
			on: extraClass === c.id,
			onClick: () => setExtraClass(c.id),
			label: c.label
		}, c.id))
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid max-h-56 grid-cols-2 gap-1 overflow-y-auto",
		children: def.variants.filter((v) => {
			if (def.kind !== "extra" || extraClass === "all" || v.id === "none") return true;
			return v.cls === extraClass;
		}).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => setVariant(selected, v.id),
			className: cn("h-9 rounded-sm border px-2 text-left text-[11px]", st.variant === v.id ? "border-fg bg-surface text-fg" : "border-border text-muted hover:text-fg"),
			children: v.name
		}, v.id))
	})] });
	const visToggle = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg",
		"aria-label": anyVisible ? "Hide all" : "Show all",
		onClick: () => anyVisible ? hideAllParts() : showAllParts(),
		children: anyVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3.5" })
	});
	const partsBody = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex items-center gap-1 overflow-x-auto border-b border-border p-2 lg:flex-wrap",
				children: [GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setGroupFilter(g.id),
					className: cn("h-8 shrink-0 rounded-sm px-2.5 text-xs", groupFilter === g.id ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface hover:text-fg"),
					children: g.label
				}, g.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto lg:hidden",
					children: visToggle
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1 p-2",
					children: groupSlots.map((s) => {
						const cur = slots[s.id];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setSelected(s.id),
							className: cn("flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm", selected === s.id ? "bg-surface text-fg" : "text-muted hover:bg-elevated hover:text-fg"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate font-mono text-[10px] text-subtle",
								children: variantLabel(s.id, cur?.variant ?? "")
							})]
						}) }, s.id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 border-t border-border px-2 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxisSliders, {
							title: "Position",
							x: gx.px,
							y: gx.py,
							z: gx.pz,
							min: -.8,
							max: .8,
							step: .005,
							onChange: (axis, v) => patchGroupXform(groupFilter, { [axis === "x" ? "px" : axis === "y" ? "py" : "pz"]: v }),
							onReset: () => resetGroupXform(groupFilter, [
								"px",
								"py",
								"pz"
							])
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxisSliders, {
							title: "Rotate (°)",
							x: gx.rx,
							y: gx.ry,
							z: gx.rz,
							min: -180,
							max: 180,
							step: 1,
							onChange: (axis, v) => patchGroupXform(groupFilter, { [axis === "x" ? "rx" : axis === "y" ? "ry" : "rz"]: v }),
							onReset: () => resetGroupXform(groupFilter, [
								"rx",
								"ry",
								"rz"
							])
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxisSliders, {
							title: uniformScale ? "Scale (Uniform)" : "Scale",
							x: gx.sx,
							y: gx.sy,
							z: gx.sz,
							min: .15,
							max: 2.6,
							step: .01,
							onChange: (axis, v) => patchGroupXform(groupFilter, { [axis === "x" ? "sx" : axis === "y" ? "sy" : "sz"]: v }),
							onReset: () => resetGroupXform(groupFilter, [
								"sx",
								"sy",
								"sz"
							])
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border p-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => setGroupVisible(groupFilter, !groupVisible),
							children: groupVisible ? "Hide" : "Show"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => resetGroupDefault(groupFilter),
							children: "Default"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1 text-[11px] text-muted",
						children: "Explode"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: 1,
						step: .01,
						value: explode,
						onChange: (e) => setExplode(Number(e.target.value)),
						className: "h-8 w-full accent-fg"
					})
				]
			})
		]
	});
	const adjustBody = def && st && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full overflow-y-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 pt-3 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg tracking-tight",
					children: def.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs text-muted",
					children: variantLabel(selected, st.variant)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-b border-border px-3 py-3",
				children: [stylePicker, otherPicker]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HsbSliders, {
						title: "Part 1 Color",
						hex: st.paint ?? getRecipe(st.variant).palette.prim,
						onChange: (hex) => patchSlot(selected, { paint: hex })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => applyPaint(st.paint ?? getRecipe(st.variant).palette.prim, def.group),
							children: "Group"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => applyPaint(st.paint ?? getRecipe(st.variant).palette.prim),
							children: "Body"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HsbSliders, {
						title: "Part 2 Color",
						hex: st.paint2 ?? getRecipe(st.variant).palette.sec,
						onChange: (hex) => patchSlot(selected, { paint2: hex })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => applyPaint2(st.paint2 ?? getRecipe(st.variant).palette.sec, def.group),
							children: "Group"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => applyPaint2(st.paint2 ?? getRecipe(st.variant).palette.sec),
							children: "Body"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HsbSliders, {
						title: "Light Color",
						hex: light || slots.visor?.paint || "#79d7ff",
						onChange: (hex) => setLight(hex)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => applyVisorPaint(light || "#79d7ff", def.group),
							children: "Group"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => applyVisorPaint(light || "#79d7ff"),
							children: "Body"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border px-3 py-3 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxisSliders, {
						title: "Position",
						x: st.px,
						y: st.py,
						z: st.pz,
						min: -.8,
						max: .8,
						step: .005,
						onChange: (axis, v) => patchSlot(selected, { [axis === "x" ? "px" : axis === "y" ? "py" : "pz"]: v }),
						onReset: () => patchSlot(selected, {
							px: 0,
							py: 0,
							pz: 0
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxisSliders, {
						title: "Rotate (°)",
						x: st.rx,
						y: st.ry,
						z: st.rz,
						min: -180,
						max: 180,
						step: 1,
						onChange: (axis, v) => patchSlot(selected, { [axis === "x" ? "rx" : axis === "y" ? "ry" : "rz"]: v }),
						onReset: () => patchSlot(selected, {
							rx: 0,
							ry: 0,
							rz: 0
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxisSliders, {
						title: uniformScale ? "Scale (Uniform)" : "Scale",
						x: st.sx,
						y: st.sy,
						z: st.sz,
						min: .15,
						max: 2.6,
						step: .01,
						onChange: (axis, v) => patchSlot(selected, { [axis === "x" ? "sx" : axis === "y" ? "sy" : "sz"]: v }),
						onReset: () => patchSlot(selected, defaultScaleFor(selected))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							on: symmetry,
							onClick: () => toggle("symmetry"),
							label: "Mirror"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							on: uniformScale,
							onClick: () => toggle("uniformScale"),
							label: "Uniform"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							on: edges,
							onClick: () => toggle("edges"),
							label: "Edges"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							on: autoRotate,
							onClick: () => toggle("autoRotate"),
							label: "Turntable"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => patchSlot(selected, { visible: !st.visible }),
						children: st.visible ? "Hide" : "Show"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => resetSlotDefault(selected),
						children: "Default"
					})]
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex h-12 shrink-0 items-center gap-2 border-b border-border px-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/MOSA.png",
					alt: "MOSA",
					className: cn("h-[22px] w-auto shrink-0 select-none", theme === "light" && "brightness-0")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden min-w-0 flex-1 truncate font-mono text-[10px] leading-none text-muted lg:block",
					children: "Modular Omni-Support Automata / Mimetic Operating System Architecture"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "Unit name / ID",
							className: "h-8 w-44 rounded-sm border border-border bg-elevated px-2 font-mono text-xs sm:w-64",
							"aria-label": "Unit name and identification"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "iconSm",
							variant: "ghost",
							"aria-label": "Theme",
							onClick: () => setTheme(theme === "light" ? "dark" : "light"),
							children: theme === "light" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "iconSm",
							variant: "ghost",
							onClick: refreshAll,
							className: "hidden sm:inline-flex",
							"aria-label": "Reset panels",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "iconSm",
							variant: "ghost",
							onClick: randomMix,
							className: "hidden sm:inline-flex",
							"aria-label": "Random",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dices, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "iconSm",
							variant: "ghost",
							onClick: saveNow,
							"aria-label": "Save",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "iconSm",
							variant: "ghost",
							"aria-label": "Export",
							onClick: () => {
								const blob = new Blob([exportJson()], { type: "application/json" });
								const a = document.createElement("a");
								a.href = URL.createObjectURL(blob);
								a.download = `${name || "frame"}.json`;
								a.click();
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "inline-flex size-8 cursor-pointer items-center justify-center rounded-sm hover:bg-surface",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "application/json",
								className: "hidden",
								onChange: (e) => {
									const f = e.target.files?.[0];
									if (!f) return;
									f.text().then((t) => importJson(t));
								}
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "iconSm",
							variant: "ghost",
							"aria-label": "Capture",
							onClick: () => {
								const cap = window.__frameMixCapture;
								if (!cap) return;
								const a = document.createElement("a");
								a.href = cap();
								a.download = `${name || "frame"}.png`;
								a.click();
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" })
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row",
			children: [
				!lg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: cn("order-2 flex min-h-0 shrink-0 flex-col border-border lg:hidden", mobilePane === "parts" ? "flex max-h-[40%] border-t" : "hidden"),
					children: partsBody
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "relative order-1 min-h-[38vh] min-w-0 flex-1 overflow-hidden bg-bg lg:order-2 lg:min-h-0",
					children: [
						mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HangarCanvas, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HangarFallback, {}),
						mounted && poseMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoseMenu, {
							x: poseMenu.x,
							y: poseMenu.y,
							poseId,
							onPick: setPose
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pointer-events-none absolute bottom-3 right-3 hidden font-mono text-[11px] text-subtle sm:block",
							children: "Drag to orbit"
						}),
						mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden lg:block",
							children: [panels.parts && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatPanel, {
								title: "Parts",
								rect: panels.parts,
								z: zOf("parts"),
								onChange: (p) => setPanel("parts", p),
								onReset: () => setPanel("parts", defaultPanels().parts),
								onFocus: () => focusPanel("parts"),
								extra: visToggle,
								children: partsBody
							}), panels.adjust && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatPanel, {
								title: "Details",
								rect: panels.adjust,
								z: zOf("adjust"),
								onChange: (p) => setPanel("adjust", p),
								onReset: () => setPanel("adjust", defaultPanels().adjust),
								onFocus: () => focusPanel("adjust"),
								extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg",
									"aria-label": "Reset camera",
									onClick: resetCamera,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
										viewBox: "0 0 16 16",
										className: "size-3.5",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
											cx: "8",
											cy: "8",
											r: "5.5"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
											cx: "8",
											cy: "8",
											r: "2.25"
										})]
									})
								}),
								children: adjustBody
							})]
						})
					]
				}),
				!lg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: cn("order-3 w-full max-w-none shrink-0 flex-col border-border lg:hidden", mobilePane === "adjust" ? "flex max-h-[44%] overflow-y-auto border-t" : "hidden"),
					children: adjustBody
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-4 grid grid-cols-2 border-t border-border lg:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: cn("h-11 text-sm", mobilePane === "parts" ? "bg-surface text-fg" : "text-muted"),
						onClick: () => setMobilePane("parts"),
						children: "Parts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: cn("h-11 text-sm", mobilePane === "adjust" ? "bg-surface text-fg" : "text-muted"),
						onClick: () => setMobilePane("adjust"),
						children: "Details"
					})]
				})
			]
		})]
	});
}
function PoseIcon({ kind }) {
	if (kind === "attention") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "9.5",
				y: "2.2",
				width: "5",
				height: "4.6",
				rx: "0.7"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7.2v8" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.6 8.6v6.6M15.4 8.6v6.6" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 15.2v6.4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.4 21.6h3.2" })
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "9.3",
				y: "2",
				width: "5",
				height: "4.4",
				rx: "0.7"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 6.6v7.2" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7.4 9.4h4.2v4.4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16.6 9.4h-4.2v3.6" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 13.8 8.8 21.6M12 13.8l3.4 7.8" })
		]
	});
}
function PoseMenu({ x, y, poseId, onPick }) {
	const left = `clamp(8px, ${x + 6}px, calc(100% - 108px))`;
	const top = `clamp(8px, ${y + 6}px, calc(100% - 60px))`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-pose-menu": true,
		role: "menu",
		"aria-label": "Posing",
		className: "pose-menu absolute z-50 flex rounded-md border border-border bg-elevated/95 p-1 shadow-sm backdrop-blur-sm",
		style: {
			left,
			top
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			role: "menuitem",
			"aria-label": "Attention pose",
			"aria-pressed": poseId === "attention",
			onClick: () => onPick("attention"),
			className: cn("flex size-11 items-center justify-center rounded-sm text-muted transition-[background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-surface hover:text-fg", poseId === "attention" && "bg-surface text-fg"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoseIcon, { kind: "attention" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			role: "menuitem",
			"aria-label": "Current pose",
			"aria-pressed": poseId === "aim",
			onClick: () => onPick("aim"),
			className: cn("flex size-11 items-center justify-center rounded-sm text-muted transition-[background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-surface hover:text-fg", poseId === "aim" && "bg-surface text-fg"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoseIcon, { kind: "aim" })
		})]
	});
}
function StylePicker({ current, filtered, quad, onQuad, onPick, onApplyAll, onApplyGroup }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1.5 text-xs text-muted",
			children: "ID"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex flex-wrap gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
				on: quad === "all",
				onClick: () => onQuad("all"),
				label: "TTL"
			}), QUAD_RANGES.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
				on: quad === q.id,
				onClick: () => onQuad(q.id),
				label: q.id
			}, q.id))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-2 grid max-h-48 grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-1 overflow-y-auto",
			children: filtered.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => onPick(s.id),
				className: cn("h-8 w-full rounded-sm border px-1 font-mono text-[10px]", current === s.id ? "border-fg bg-surface text-fg" : "border-border text-muted hover:text-fg"),
				children: s.id
			}, s.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "outline",
				onClick: () => onApplyGroup(current),
				children: "Group"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "outline",
				onClick: () => onApplyAll(current),
				children: "Body"
			})]
		})
	] });
}
function Chip({ on, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("h-7 rounded-sm border px-2 text-[11px]", on ? "border-fg bg-surface text-fg" : "border-border text-muted"),
		children: label
	});
}
function Toggle({ on, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("h-8 rounded-sm border px-2 text-[11px]", on ? "border-fg bg-surface text-fg" : "border-border text-muted"),
		children: label
	});
}
function HangarFallback() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-bg" });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
//#endregion
export { Home as component };
