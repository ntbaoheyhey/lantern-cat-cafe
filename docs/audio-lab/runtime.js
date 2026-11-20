var e = {
	mochi: {
		source: 110011,
		baseSemitones: -4.4,
		range: 2,
		speed: .18,
		brightness: 2238,
		breathiness: .02,
		formantShift: .82,
		signature: "purr",
		personality: "Steady door keeper",
		lines: {
			select: ["Right here."],
			attack: [
				"Knock knock!",
				"Stand back!",
				"With me!"
			],
			skill: ["Stay behind me!"],
			ult: ["Shields up!"],
			hit: ["Still standing."],
			death: ["Keep them safe."],
			victory: ["Everyone home."]
		},
		rolloff: 3.3,
		colorHz: 1385,
		colorDb: 7.88,
		vowelMix: .56
	},
	soot: {
		source: 264507,
		baseSemitones: -3.84,
		range: 3,
		speed: .15,
		brightness: 585,
		breathiness: .08,
		formantShift: .91,
		signature: "trill",
		personality: "Dry, mischievous ash reader",
		lines: {
			select: ["After dark."],
			attack: [
				"Little spark!",
				"Black coffee!",
				"Found you!"
			],
			skill: ["Watch the wick!"],
			ult: ["Lights out!"],
			hit: ["Too bright."],
			death: ["Last ember."],
			victory: ["Night served."]
		},
		rolloff: 1.15,
		colorHz: 658,
		colorDb: 10.02,
		vowelMix: .6
	},
	clover: {
		source: 451250,
		baseSemitones: 5.79,
		range: 4,
		speed: .2,
		brightness: 5624,
		breathiness: .04,
		formantShift: 1.16,
		signature: "trill",
		personality: "Patient garden healer",
		lines: {
			select: ["Take your time."],
			attack: [
				"Leaf tap!",
				"Easy now!",
				"Gentle touch!"
			],
			skill: ["Let it steep."],
			ult: ["Bloom again!"],
			hit: ["Just a scratch."],
			death: ["Rest a little."],
			victory: ["Growing strong."]
		},
		rolloff: 1.97,
		colorHz: 1900,
		colorDb: 2.91,
		vowelMix: .58
	},
	panko: {
		source: 656249,
		baseSemitones: 3.53,
		range: 3,
		speed: .17,
		brightness: 3256,
		breathiness: .03,
		formantShift: .78,
		signature: "purr",
		personality: "Warm, stubborn counter guardian",
		lines: {
			select: ["Fresh from oven!"],
			attack: [
				"Pan ready!",
				"Hot crust!",
				"Your turn!"
			],
			skill: ["Bread cover!"],
			ult: ["Oven door!"],
			hit: ["Hard crust."],
			death: ["Cooling down."],
			victory: ["Golden finish!"]
		},
		rolloff: 1.2,
		colorHz: 1284,
		colorDb: 14.57,
		vowelMix: .32
	},
	mallow: {
		source: 333916,
		baseSemitones: 7.03,
		range: 5,
		speed: .14,
		brightness: 4727,
		breathiness: .09,
		formantShift: 1.24,
		signature: "trill",
		personality: "Impatient fire whisk",
		lines: {
			select: ["Heat it up!"],
			attack: [
				"Sizzle!",
				"Sugar rush!",
				"Hot stuff!"
			],
			skill: ["Kettle's boiling!"],
			ult: ["Burn bright!"],
			hit: ["Still hot!"],
			death: ["Flame low."],
			victory: ["Perfectly toasted!"]
		},
		rolloff: 2.42,
		colorHz: 1578,
		colorDb: 13.79,
		vowelMix: .33
	},
	sorrel: {
		source: 668821,
		baseSemitones: 1.98,
		range: 2,
		speed: .23,
		brightness: 6084,
		breathiness: .02,
		formantShift: .96,
		signature: "trill",
		personality: "Measured moon brewer",
		lines: {
			select: ["One measured pour."],
			attack: [
				"Moon spoon!",
				"Cool down!",
				"Steady now."
			],
			skill: ["Share the warmth."],
			ult: ["One more cup!"],
			hit: ["No spills."],
			death: ["Cup empty."],
			victory: ["Just enough."]
		},
		rolloff: 1.64,
		colorHz: 221,
		colorDb: 10.28,
		vowelMix: .55
	},
	biscuit: {
		source: 763906,
		baseSemitones: -10.94,
		range: 3,
		speed: .19,
		brightness: 815,
		breathiness: .06,
		formantShift: .72,
		signature: "purr",
		personality: "Gruff, dependable baker",
		lines: {
			select: ["Let's get rolling."],
			attack: [
				"Roll out!",
				"Last crumb!",
				"Coming through!"
			],
			skill: ["Make some room!"],
			ult: ["Bakers march!"],
			hit: ["Tough cookie."],
			death: ["Crumbs remain."],
			victory: ["Job well baked."]
		},
		rolloff: 2.7,
		colorHz: 393,
		colorDb: 9.86,
		vowelMix: .49
	},
	inkcap: {
		source: 845517,
		baseSemitones: 1.43,
		range: 2,
		speed: .21,
		brightness: 1176,
		breathiness: .14,
		formantShift: 1.09,
		signature: "trill",
		personality: "Whispering woodland trickster",
		lines: {
			select: ["Quiet company."],
			attack: [
				"Ink drop.",
				"Shh now.",
				"Paper trick!"
			],
			skill: ["Follow the spores."],
			ult: ["Sweet dreams!"],
			hit: ["Only paper."],
			death: ["Page turns."],
			victory: ["A quiet ending."]
		},
		rolloff: 1.88,
		colorHz: 887,
		colorDb: 11.78,
		vowelMix: .55
	},
	cinnamon: {
		source: 756236,
		baseSemitones: 11.91,
		range: 3,
		speed: .2,
		brightness: 6358,
		breathiness: .05,
		formantShift: 1.28,
		signature: "purr",
		personality: "Bright, reassuring comfort brewer",
		lines: {
			select: ["A little comfort."],
			attack: [
				"Spice pinch!",
				"Warm sip!",
				"Apron ready!"
			],
			skill: ["Fresh start!"],
			ult: ["Back for seconds!"],
			hit: ["I'm alright."],
			death: ["Save a cup."],
			victory: ["Come sit down."]
		},
		rolloff: 1.89,
		colorHz: 2918,
		colorDb: 9.51,
		vowelMix: .56
	},
	brioche: {
		source: 814892,
		baseSemitones: 1.02,
		range: 4,
		speed: .22,
		brightness: 5846,
		breathiness: .02,
		formantShift: .88,
		signature: "purr",
		personality: "Formal night watch guardian",
		lines: {
			select: ["Night watch ready."],
			attack: [
				"Bell patrol!",
				"Collar straight!",
				"Hold fast!"
			],
			skill: ["Borrow my blanket."],
			ult: ["Stars protect us!"],
			hit: ["Duty calls."],
			death: ["Watch carries on."],
			victory: ["All accounted for."]
		},
		rolloff: 2.01,
		colorHz: 544,
		colorDb: -3.9,
		vowelMix: .22
	},
	velvet: {
		source: 668824,
		baseSemitones: -2.61,
		range: 5,
		speed: .16,
		brightness: 2069,
		breathiness: .12,
		formantShift: 1.04,
		signature: "trill",
		personality: "Elegant candle thief",
		lines: {
			select: ["Shall we dance?"],
			attack: [
				"Silk touch!",
				"Borrowed flame!",
				"Catch me!"
			],
			skill: ["Watch closely."],
			ult: ["Curtain falls!"],
			hit: ["How rude."],
			death: ["Final bow."],
			victory: ["Lovely audience."]
		},
		rolloff: 3.41,
		colorHz: 1365,
		colorDb: 13.6,
		vowelMix: .39
	},
	marigold: {
		source: 234333,
		baseSemitones: 12,
		range: 4,
		speed: .17,
		brightness: 1010,
		breathiness: .03,
		formantShift: 1.36,
		signature: "trill",
		personality: "Eager dawn gardener",
		lines: {
			select: ["Morning is coming!"],
			attack: [
				"Seed stitch!",
				"Grow tall!",
				"Fresh shoots!"
			],
			skill: ["Ring the garden!"],
			ult: ["First tea bloom!"],
			hit: ["Bent, still growing."],
			death: ["Plant another."],
			victory: ["A new day!"]
		},
		rolloff: 3.34,
		colorHz: 2364,
		colorDb: 1.88,
		vowelMix: .24
	}
}, t = [
	"master",
	"music",
	"ambience",
	"sfx",
	"voice",
	"ui"
], n = {
	"ui.forge-success": "ui.forge.success",
	"ui.forge-fail": "ui.forge.fail",
	"music.map": "music.home",
	"music.gacha": "music.home"
}, r = Object.fromEntries(Object.entries(e).map(([e, t]) => [e, {
	...t,
	pitch: 2 ** (t.baseSemitones / 12),
	timbre: String(t.source)
}]));
function i(e, t, r = "magic") {
	e = n[e] ?? e;
	let i = t.bindings?.[e] ?? e;
	return e.startsWith("ult.") && (i = `kit.${r}.${e.split(".").at(-1)}`), e.startsWith("skill.") && (i = `kit.${r}.${e.endsWith(".cast") ? "charge" : "impact"}`), t.designs?.[i] ?? t.designs?.[t.bindings?.[e] ?? e];
}
function a(e, t, r = "magic") {
	n[e] && (e = n[e]);
	let a = i(e, t, r);
	if (a) return a.baked?.map((e) => e.sample) ?? a.layers[0]?.variants;
	if (t.cues[e]) return t.cues[e];
	if (e.startsWith("voice.")) return t.cues["voice.meow"];
	if (e.startsWith("ult.")) return t.cues[`kit.${r}.${e.split(".").at(-1)}`] ?? t.cues[`kit.magic.${e.split(".").at(-1)}`];
	if (e.startsWith("skill.")) return t.cues[`kit.${r}.${e.endsWith(".cast") ? "charge" : "impact"}`] ?? t.cues["hit.magic"];
	if (e.startsWith("status.")) return t.cues[`status.${e.split(".")[1]}.${e.split(".").at(-1)}`] ?? t.cues["status.shield.on"];
}
// apps/web/src/audio/callouts.ts
var o = /* @__PURE__ */ JSON.parse("[{\"unitId\":\"mochi\",\"kind\":\"skill\",\"skillId\":\"mochi-1\",\"skillName\":\"Door knock\",\"slot\":1,\"cueId\":\"voice.mochi.skill.mochi-1\",\"text\":\"Knock knock!\",\"durationMs\":1138,\"syncPointMs\":40},{\"unitId\":\"mochi\",\"kind\":\"skill\",\"skillId\":\"mochi-2\",\"skillName\":\"Warm welcome\",\"slot\":2,\"cueId\":\"voice.mochi.skill.mochi-2\",\"text\":\"Warm welcome!\",\"durationMs\":1297,\"syncPointMs\":40},{\"unitId\":\"mochi\",\"kind\":\"skill\",\"skillId\":\"mochi-3\",\"skillName\":\"Apron crossing\",\"slot\":3,\"cueId\":\"voice.mochi.skill.mochi-3\",\"text\":\"Stay behind me!\",\"durationMs\":1520,\"syncPointMs\":40},{\"unitId\":\"mochi\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"mochi-4\",\"skillName\":\"Last light shelter\",\"cueId\":\"voice.mochi.ult.charge\",\"text\":\"Shields!\",\"durationMs\":1321,\"syncPointMs\":95},{\"unitId\":\"mochi\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"mochi-4\",\"skillName\":\"Last light shelter\",\"cueId\":\"voice.mochi.ult.release\",\"text\":\"Shields up!\",\"durationMs\":1430,\"syncPointMs\":40},{\"unitId\":\"soot\",\"kind\":\"skill\",\"skillId\":\"soot-1\",\"skillName\":\"Cocoa spark\",\"slot\":1,\"cueId\":\"voice.soot.skill.soot-1\",\"text\":\"Cocoa spark!\",\"durationMs\":1341,\"syncPointMs\":40},{\"unitId\":\"soot\",\"kind\":\"skill\",\"skillId\":\"soot-2\",\"skillName\":\"Black cup\",\"slot\":2,\"cueId\":\"voice.soot.skill.soot-2\",\"text\":\"Found you!\",\"durationMs\":1068,\"syncPointMs\":40},{\"unitId\":\"soot\",\"kind\":\"skill\",\"skillId\":\"soot-3\",\"skillName\":\"Lantern wick\",\"slot\":3,\"cueId\":\"voice.soot.skill.soot-3\",\"text\":\"Light the wick!\",\"durationMs\":1175,\"syncPointMs\":40},{\"unitId\":\"soot\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"soot-4\",\"skillName\":\"Midnight service\",\"cueId\":\"voice.soot.ult.charge\",\"text\":\"Lights!\",\"durationMs\":1043,\"syncPointMs\":95},{\"unitId\":\"soot\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"soot-4\",\"skillName\":\"Midnight service\",\"cueId\":\"voice.soot.ult.release\",\"text\":\"Lights out!\",\"durationMs\":1325,\"syncPointMs\":40},{\"unitId\":\"clover\",\"kind\":\"skill\",\"skillId\":\"clover-1\",\"skillName\":\"Leaf tap\",\"slot\":1,\"cueId\":\"voice.clover.skill.clover-1\",\"text\":\"Leaf tap!\",\"durationMs\":1068,\"syncPointMs\":40},{\"unitId\":\"clover\",\"kind\":\"skill\",\"skillId\":\"clover-2\",\"skillName\":\"Patient steep\",\"slot\":2,\"cueId\":\"voice.clover.skill.clover-2\",\"text\":\"Let it steep!\",\"durationMs\":1168,\"syncPointMs\":40},{\"unitId\":\"clover\",\"kind\":\"skill\",\"skillId\":\"clover-3\",\"skillName\":\"Clearleaf rinse\",\"slot\":3,\"cueId\":\"voice.clover.skill.clover-3\",\"text\":\"Fresh and clear!\",\"durationMs\":1402,\"syncPointMs\":40},{\"unitId\":\"clover\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"clover-4\",\"skillName\":\"Greenhouse morning\",\"cueId\":\"voice.clover.ult.charge\",\"text\":\"Watch the flowers bloom!\",\"durationMs\":1924,\"syncPointMs\":95},{\"unitId\":\"clover\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"clover-4\",\"skillName\":\"Greenhouse morning\",\"cueId\":\"voice.clover.ult.release\",\"text\":\"Bloom again!\",\"durationMs\":1463,\"syncPointMs\":40},{\"unitId\":\"panko\",\"kind\":\"skill\",\"skillId\":\"panko-1\",\"skillName\":\"Pan reply\",\"slot\":1,\"cueId\":\"voice.panko.skill.panko-1\",\"text\":\"Pan ready!\",\"durationMs\":1099,\"syncPointMs\":40},{\"unitId\":\"panko\",\"kind\":\"skill\",\"skillId\":\"panko-2\",\"skillName\":\"Bread cover\",\"slot\":2,\"cueId\":\"voice.panko.skill.panko-2\",\"text\":\"Bread cover!\",\"durationMs\":1263,\"syncPointMs\":40},{\"unitId\":\"panko\",\"kind\":\"skill\",\"skillId\":\"panko-3\",\"skillName\":\"Crust return\",\"slot\":3,\"cueId\":\"voice.panko.skill.panko-3\",\"text\":\"Send it back!\",\"durationMs\":1381,\"syncPointMs\":40},{\"unitId\":\"panko\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"panko-4\",\"skillName\":\"Oven door\",\"cueId\":\"voice.panko.ult.charge\",\"text\":\"Close!\",\"durationMs\":1111,\"syncPointMs\":95},{\"unitId\":\"panko\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"panko-4\",\"skillName\":\"Oven door\",\"cueId\":\"voice.panko.ult.release\",\"text\":\"Close the door!\",\"durationMs\":1513,\"syncPointMs\":40},{\"unitId\":\"mallow\",\"kind\":\"skill\",\"skillId\":\"mallow-1\",\"skillName\":\"Whisk flare\",\"slot\":1,\"cueId\":\"voice.mallow.skill.mallow-1\",\"text\":\"Whisk flare!\",\"durationMs\":1135,\"syncPointMs\":40},{\"unitId\":\"mallow\",\"kind\":\"skill\",\"skillId\":\"mallow-2\",\"skillName\":\"Split ember\",\"slot\":2,\"cueId\":\"voice.mallow.skill.mallow-2\",\"text\":\"Split the flame!\",\"durationMs\":1344,\"syncPointMs\":40},{\"unitId\":\"mallow\",\"kind\":\"skill\",\"skillId\":\"mallow-3\",\"skillName\":\"Burnt sugar\",\"slot\":3,\"cueId\":\"voice.mallow.skill.mallow-3\",\"text\":\"Sugar burns!\",\"durationMs\":1383,\"syncPointMs\":40},{\"unitId\":\"mallow\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"mallow-4\",\"skillName\":\"Closing blaze\",\"cueId\":\"voice.mallow.ult.charge\",\"text\":\"Burn!\",\"durationMs\":975,\"syncPointMs\":95},{\"unitId\":\"mallow\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"mallow-4\",\"skillName\":\"Closing blaze\",\"cueId\":\"voice.mallow.ult.release\",\"text\":\"Burn bright!\",\"durationMs\":1210,\"syncPointMs\":40},{\"unitId\":\"sorrel\",\"kind\":\"skill\",\"skillId\":\"sorrel-1\",\"skillName\":\"Moon spoon\",\"slot\":1,\"cueId\":\"voice.sorrel.skill.sorrel-1\",\"text\":\"Moon spoon!\",\"durationMs\":1314,\"syncPointMs\":40},{\"unitId\":\"sorrel\",\"kind\":\"skill\",\"skillId\":\"sorrel-2\",\"skillName\":\"Cold brew\",\"slot\":2,\"cueId\":\"voice.sorrel.skill.sorrel-2\",\"text\":\"Cool down!\",\"durationMs\":1242,\"syncPointMs\":40},{\"unitId\":\"sorrel\",\"kind\":\"skill\",\"skillId\":\"sorrel-3\",\"skillName\":\"Decanted moon\",\"slot\":3,\"cueId\":\"voice.sorrel.skill.sorrel-3\",\"text\":\"Share my shield!\",\"durationMs\":1589,\"syncPointMs\":40},{\"unitId\":\"sorrel\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"sorrel-4\",\"skillName\":\"Shared pot\",\"cueId\":\"voice.sorrel.ult.charge\",\"text\":\"One more cup!\",\"durationMs\":1310,\"syncPointMs\":95},{\"unitId\":\"sorrel\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"sorrel-4\",\"skillName\":\"Shared pot\",\"cueId\":\"voice.sorrel.ult.release\",\"text\":\"One more cup!\",\"durationMs\":1291,\"syncPointMs\":40},{\"unitId\":\"biscuit\",\"kind\":\"skill\",\"skillId\":\"biscuit-1\",\"skillName\":\"Rolling pin\",\"slot\":1,\"cueId\":\"voice.biscuit.skill.biscuit-1\",\"text\":\"Roll out!\",\"durationMs\":1115,\"syncPointMs\":40},{\"unitId\":\"biscuit\",\"kind\":\"skill\",\"skillId\":\"biscuit-2\",\"skillName\":\"Sideboard step\",\"slot\":2,\"cueId\":\"voice.biscuit.skill.biscuit-2\",\"text\":\"Make some room!\",\"durationMs\":1340,\"syncPointMs\":40},{\"unitId\":\"biscuit\",\"kind\":\"skill\",\"skillId\":\"biscuit-3\",\"skillName\":\"Last crumb\",\"slot\":3,\"cueId\":\"voice.biscuit.skill.biscuit-3\",\"text\":\"Last crumb!\",\"durationMs\":1263,\"syncPointMs\":40},{\"unitId\":\"biscuit\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"biscuit-4\",\"skillName\":\"Bakers procession\",\"cueId\":\"voice.biscuit.ult.charge\",\"text\":\"Move with me!\",\"durationMs\":1356,\"syncPointMs\":95},{\"unitId\":\"biscuit\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"biscuit-4\",\"skillName\":\"Bakers procession\",\"cueId\":\"voice.biscuit.ult.release\",\"text\":\"Charge together!\",\"durationMs\":1327,\"syncPointMs\":40},{\"unitId\":\"inkcap\",\"kind\":\"skill\",\"skillId\":\"inkcap-1\",\"skillName\":\"Ink thread\",\"slot\":1,\"cueId\":\"voice.inkcap.skill.inkcap-1\",\"text\":\"Ink thread!\",\"durationMs\":1154,\"syncPointMs\":40},{\"unitId\":\"inkcap\",\"kind\":\"skill\",\"skillId\":\"inkcap-2\",\"skillName\":\"Quiet spores\",\"slot\":2,\"cueId\":\"voice.inkcap.skill.inkcap-2\",\"text\":\"Quiet now!\",\"durationMs\":1128,\"syncPointMs\":40},{\"unitId\":\"inkcap\",\"kind\":\"skill\",\"skillId\":\"inkcap-3\",\"skillName\":\"Paper decoy\",\"slot\":3,\"cueId\":\"voice.inkcap.skill.inkcap-3\",\"text\":\"Only paper!\",\"durationMs\":1153,\"syncPointMs\":40},{\"unitId\":\"inkcap\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"inkcap-4\",\"skillName\":\"Dreaming canopy\",\"cueId\":\"voice.inkcap.ult.charge\",\"text\":\"Sweet!\",\"durationMs\":1031,\"syncPointMs\":95},{\"unitId\":\"inkcap\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"inkcap-4\",\"skillName\":\"Dreaming canopy\",\"cueId\":\"voice.inkcap.ult.release\",\"text\":\"Sweet dreams!\",\"durationMs\":1542,\"syncPointMs\":40},{\"unitId\":\"cinnamon\",\"kind\":\"skill\",\"skillId\":\"cinnamon-1\",\"skillName\":\"Spice pinch\",\"slot\":1,\"cueId\":\"voice.cinnamon.skill.cinnamon-1\",\"text\":\"Spice pinch!\",\"durationMs\":1291,\"syncPointMs\":40},{\"unitId\":\"cinnamon\",\"kind\":\"skill\",\"skillId\":\"cinnamon-2\",\"skillName\":\"Comfort cup\",\"slot\":2,\"cueId\":\"voice.cinnamon.skill.cinnamon-2\",\"text\":\"Drink up!\",\"durationMs\":1230,\"syncPointMs\":40},{\"unitId\":\"cinnamon\",\"kind\":\"skill\",\"skillId\":\"cinnamon-3\",\"skillName\":\"Clean apron\",\"slot\":3,\"cueId\":\"voice.cinnamon.skill.cinnamon-3\",\"text\":\"Fresh start!\",\"durationMs\":1460,\"syncPointMs\":40},{\"unitId\":\"cinnamon\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"cinnamon-4\",\"skillName\":\"Second serving\",\"cueId\":\"voice.cinnamon.ult.charge\",\"text\":\"Stay back!\",\"durationMs\":1413,\"syncPointMs\":95},{\"unitId\":\"cinnamon\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"cinnamon-4\",\"skillName\":\"Second serving\",\"cueId\":\"voice.cinnamon.ult.release\",\"text\":\"Back for seconds!\",\"durationMs\":1713,\"syncPointMs\":40},{\"unitId\":\"brioche\",\"kind\":\"skill\",\"skillId\":\"brioche-1\",\"skillName\":\"Bell patrol\",\"slot\":1,\"cueId\":\"voice.brioche.skill.brioche-1\",\"text\":\"Bell patrol!\",\"durationMs\":1259,\"syncPointMs\":40},{\"unitId\":\"brioche\",\"kind\":\"skill\",\"skillId\":\"brioche-2\",\"skillName\":\"Borrowed blanket\",\"slot\":2,\"cueId\":\"voice.brioche.skill.brioche-2\",\"text\":\"Borrow my blanket!\",\"durationMs\":1477,\"syncPointMs\":40},{\"unitId\":\"brioche\",\"kind\":\"skill\",\"skillId\":\"brioche-3\",\"skillName\":\"Starched collar\",\"slot\":3,\"cueId\":\"voice.brioche.skill.brioche-3\",\"text\":\"Collar straight!\",\"durationMs\":1468,\"syncPointMs\":40},{\"unitId\":\"brioche\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"brioche-4\",\"skillName\":\"Constellation apron\",\"cueId\":\"voice.brioche.ult.charge\",\"text\":\"Stars!\",\"durationMs\":1299,\"syncPointMs\":95},{\"unitId\":\"brioche\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"brioche-4\",\"skillName\":\"Constellation apron\",\"cueId\":\"voice.brioche.ult.release\",\"text\":\"Stars protect us!\",\"durationMs\":1830,\"syncPointMs\":40},{\"unitId\":\"velvet\",\"kind\":\"skill\",\"skillId\":\"velvet-1\",\"skillName\":\"Silk nick\",\"slot\":1,\"cueId\":\"voice.velvet.skill.velvet-1\",\"text\":\"Silk touch!\",\"durationMs\":1302,\"syncPointMs\":40},{\"unitId\":\"velvet\",\"kind\":\"skill\",\"skillId\":\"velvet-2\",\"skillName\":\"Candle bounce\",\"slot\":2,\"cueId\":\"voice.velvet.skill.velvet-2\",\"text\":\"Catch the candle!\",\"durationMs\":1344,\"syncPointMs\":40},{\"unitId\":\"velvet\",\"kind\":\"skill\",\"skillId\":\"velvet-3\",\"skillName\":\"Stolen flame\",\"slot\":3,\"cueId\":\"voice.velvet.skill.velvet-3\",\"text\":\"Borrowed flame!\",\"durationMs\":1332,\"syncPointMs\":40},{\"unitId\":\"velvet\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"velvet-4\",\"skillName\":\"Velvet curtain\",\"cueId\":\"voice.velvet.ult.charge\",\"text\":\"Raise the curtain!\",\"durationMs\":1289,\"syncPointMs\":95},{\"unitId\":\"velvet\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"velvet-4\",\"skillName\":\"Velvet curtain\",\"cueId\":\"voice.velvet.ult.release\",\"text\":\"Curtain falls!\",\"durationMs\":1445,\"syncPointMs\":40},{\"unitId\":\"marigold\",\"kind\":\"skill\",\"skillId\":\"marigold-1\",\"skillName\":\"Seed stitch\",\"slot\":1,\"cueId\":\"voice.marigold.skill.marigold-1\",\"text\":\"Seed stitch!\",\"durationMs\":1390,\"syncPointMs\":40},{\"unitId\":\"marigold\",\"kind\":\"skill\",\"skillId\":\"marigold-2\",\"skillName\":\"Garden bell\",\"slot\":2,\"cueId\":\"voice.marigold.skill.marigold-2\",\"text\":\"Ring the garden!\",\"durationMs\":1227,\"syncPointMs\":40},{\"unitId\":\"marigold\",\"kind\":\"skill\",\"skillId\":\"marigold-3\",\"skillName\":\"Spring pruning\",\"slot\":3,\"cueId\":\"voice.marigold.skill.marigold-3\",\"text\":\"Time to prune!\",\"durationMs\":1401,\"syncPointMs\":40},{\"unitId\":\"marigold\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"marigold-4\",\"skillName\":\"First tea blossom\",\"cueId\":\"voice.marigold.ult.charge\",\"text\":\"Rise!\",\"durationMs\":1151,\"syncPointMs\":95},{\"unitId\":\"marigold\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"marigold-4\",\"skillName\":\"First tea blossom\",\"cueId\":\"voice.marigold.ult.release\",\"text\":\"Rise and bloom!\",\"durationMs\":1692,\"syncPointMs\":40},{\"unitId\":\"button-guard\",\"kind\":\"skill\",\"skillId\":\"enemy:button-guard:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.button-guard.skill.enemy:button-guard:basic\",\"text\":\"Button cut!\",\"durationMs\":1382,\"syncPointMs\":40},{\"unitId\":\"button-guard\",\"kind\":\"skill\",\"skillId\":\"enemy:button-guard\",\"skillName\":\"shield\",\"slot\":2,\"cueId\":\"voice.button-guard.skill.enemy:button-guard\",\"text\":\"Brace up!\",\"durationMs\":1063,\"syncPointMs\":40},{\"unitId\":\"button-guard\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:button-guard\",\"skillName\":\"shield\",\"cueId\":\"voice.button-guard.ult.charge\",\"text\":\"Hold the line!\",\"durationMs\":1347,\"syncPointMs\":95},{\"unitId\":\"button-guard\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:button-guard\",\"skillName\":\"shield\",\"cueId\":\"voice.button-guard.ult.release\",\"text\":\"Hold the line!\",\"durationMs\":1373,\"syncPointMs\":40},{\"unitId\":\"sock-skipper\",\"kind\":\"skill\",\"skillId\":\"enemy:sock-skipper:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.sock-skipper.skill.enemy:sock-skipper:basic\",\"text\":\"Quick step!\",\"durationMs\":1129,\"syncPointMs\":40},{\"unitId\":\"sock-skipper\",\"kind\":\"skill\",\"skillId\":\"enemy:sock-skipper\",\"skillName\":\"steal\",\"slot\":2,\"cueId\":\"voice.sock-skipper.skill.enemy:sock-skipper\",\"text\":\"Yours is mine!\",\"durationMs\":1481,\"syncPointMs\":40},{\"unitId\":\"sock-skipper\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:sock-skipper\",\"skillName\":\"steal\",\"cueId\":\"voice.sock-skipper.ult.charge\",\"text\":\"Catch!\",\"durationMs\":1065,\"syncPointMs\":95},{\"unitId\":\"sock-skipper\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:sock-skipper\",\"skillName\":\"steal\",\"cueId\":\"voice.sock-skipper.ult.release\",\"text\":\"Catch me!\",\"durationMs\":1246,\"syncPointMs\":40},{\"unitId\":\"spool-ram\",\"kind\":\"skill\",\"skillId\":\"enemy:spool-ram:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.spool-ram.skill.enemy:spool-ram:basic\",\"text\":\"Make way!\",\"durationMs\":1031,\"syncPointMs\":40},{\"unitId\":\"spool-ram\",\"kind\":\"skill\",\"skillId\":\"enemy:spool-ram\",\"skillName\":\"charge\",\"slot\":2,\"cueId\":\"voice.spool-ram.skill.enemy:spool-ram\",\"text\":\"Ram ahead!\",\"durationMs\":1094,\"syncPointMs\":40},{\"unitId\":\"spool-ram\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:spool-ram\",\"skillName\":\"charge\",\"cueId\":\"voice.spool-ram.ult.charge\",\"text\":\"Full!\",\"durationMs\":743,\"syncPointMs\":95},{\"unitId\":\"spool-ram\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:spool-ram\",\"skillName\":\"charge\",\"cueId\":\"voice.spool-ram.ult.release\",\"text\":\"Full charge!\",\"durationMs\":1296,\"syncPointMs\":40},{\"unitId\":\"needle-moth\",\"kind\":\"skill\",\"skillId\":\"enemy:needle-moth:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.needle-moth.skill.enemy:needle-moth:basic\",\"text\":\"Needle shot!\",\"durationMs\":1384,\"syncPointMs\":40},{\"unitId\":\"needle-moth\",\"kind\":\"skill\",\"skillId\":\"enemy:needle-moth\",\"skillName\":\"dot\",\"slot\":2,\"cueId\":\"voice.needle-moth.skill.enemy:needle-moth\",\"text\":\"Needle rain!\",\"durationMs\":1267,\"syncPointMs\":40},{\"unitId\":\"needle-moth\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:needle-moth\",\"skillName\":\"dot\",\"cueId\":\"voice.needle-moth.ult.charge\",\"text\":\"Wings sharp and ready!\",\"durationMs\":1928,\"syncPointMs\":95},{\"unitId\":\"needle-moth\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:needle-moth\",\"skillName\":\"dot\",\"cueId\":\"voice.needle-moth.ult.release\",\"text\":\"Sharp wings!\",\"durationMs\":1358,\"syncPointMs\":40},{\"unitId\":\"teacup-healer\",\"kind\":\"skill\",\"skillId\":\"enemy:teacup-healer:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.teacup-healer.skill.enemy:teacup-healer:basic\",\"text\":\"Cup tap!\",\"durationMs\":1068,\"syncPointMs\":40},{\"unitId\":\"teacup-healer\",\"kind\":\"skill\",\"skillId\":\"enemy:teacup-healer\",\"skillName\":\"heal\",\"slot\":2,\"cueId\":\"voice.teacup-healer.skill.enemy:teacup-healer\",\"text\":\"Fill it up!\",\"durationMs\":1164,\"syncPointMs\":40},{\"unitId\":\"teacup-healer\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:teacup-healer\",\"skillName\":\"heal\",\"cueId\":\"voice.teacup-healer.ult.charge\",\"text\":\"Fill the cup!\",\"durationMs\":1228,\"syncPointMs\":95},{\"unitId\":\"teacup-healer\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:teacup-healer\",\"skillName\":\"heal\",\"cueId\":\"voice.teacup-healer.ult.release\",\"text\":\"Full cups!\",\"durationMs\":1281,\"syncPointMs\":40},{\"unitId\":\"kettle-knight\",\"kind\":\"skill\",\"skillId\":\"enemy:kettle-knight:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.kettle-knight.skill.enemy:kettle-knight:basic\",\"text\":\"Kettle strike!\",\"durationMs\":1383,\"syncPointMs\":40},{\"unitId\":\"kettle-knight\",\"kind\":\"skill\",\"skillId\":\"enemy:kettle-knight\",\"skillName\":\"reflect\",\"slot\":2,\"cueId\":\"voice.kettle-knight.skill.enemy:kettle-knight\",\"text\":\"Steam shield!\",\"durationMs\":1396,\"syncPointMs\":40},{\"unitId\":\"kettle-knight\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:kettle-knight\",\"skillName\":\"reflect\",\"cueId\":\"voice.kettle-knight.ult.charge\",\"text\":\"Steam is rising!\",\"durationMs\":1671,\"syncPointMs\":95},{\"unitId\":\"kettle-knight\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:kettle-knight\",\"skillName\":\"reflect\",\"cueId\":\"voice.kettle-knight.ult.release\",\"text\":\"Let off steam!\",\"durationMs\":1614,\"syncPointMs\":40},{\"unitId\":\"yarn-giant\",\"kind\":\"skill\",\"skillId\":\"enemy:yarn-giant:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.yarn-giant.skill.enemy:yarn-giant:basic\",\"text\":\"Thread strike!\",\"durationMs\":1302,\"syncPointMs\":40},{\"unitId\":\"yarn-giant\",\"kind\":\"skill\",\"skillId\":\"enemy:yarn-giant\",\"skillName\":\"bind\",\"slot\":2,\"cueId\":\"voice.yarn-giant.skill.enemy:yarn-giant\",\"text\":\"Loom fall!\",\"durationMs\":1142,\"syncPointMs\":40},{\"unitId\":\"yarn-giant\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:yarn-giant\",\"skillName\":\"bind\",\"cueId\":\"voice.yarn-giant.ult.charge\",\"text\":\"Tangle!\",\"durationMs\":1030,\"syncPointMs\":95},{\"unitId\":\"yarn-giant\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:yarn-giant\",\"skillName\":\"bind\",\"cueId\":\"voice.yarn-giant.ult.release\",\"text\":\"Tangle them!\",\"durationMs\":1213,\"syncPointMs\":40},{\"unitId\":\"binding-thread\",\"kind\":\"skill\",\"skillId\":\"enemy:binding-thread:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.binding-thread.skill.enemy:binding-thread:basic\",\"text\":\"Tie tight!\",\"durationMs\":1256,\"syncPointMs\":40},{\"unitId\":\"binding-thread\",\"kind\":\"skill\",\"skillId\":\"enemy:binding-thread\",\"skillName\":\"snare\",\"slot\":2,\"cueId\":\"voice.binding-thread.skill.enemy:binding-thread\",\"text\":\"Knot them!\",\"durationMs\":1003,\"syncPointMs\":40},{\"unitId\":\"binding-thread\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:binding-thread\",\"skillName\":\"snare\",\"cueId\":\"voice.binding-thread.ult.charge\",\"text\":\"Bound!\",\"durationMs\":1023,\"syncPointMs\":95},{\"unitId\":\"binding-thread\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:binding-thread\",\"skillName\":\"snare\",\"cueId\":\"voice.binding-thread.ult.release\",\"text\":\"Hold them tight!\",\"durationMs\":1418,\"syncPointMs\":40},{\"unitId\":\"practice-cushion\",\"kind\":\"skill\",\"skillId\":\"enemy:practice-cushion:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.practice-cushion.skill.enemy:practice-cushion:basic\",\"text\":\"A gentle tap!\",\"durationMs\":1432,\"syncPointMs\":40},{\"unitId\":\"practice-cushion\",\"kind\":\"skill\",\"skillId\":\"enemy:practice-cushion\",\"skillName\":\"lesson\",\"slot\":2,\"cueId\":\"voice.practice-cushion.skill.enemy:practice-cushion\",\"text\":\"Try again!\",\"durationMs\":1254,\"syncPointMs\":40},{\"unitId\":\"practice-cushion\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:practice-cushion\",\"skillName\":\"lesson\",\"cueId\":\"voice.practice-cushion.ult.charge\",\"text\":\"Good luck to you!\",\"durationMs\":1465,\"syncPointMs\":95},{\"unitId\":\"practice-cushion\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:practice-cushion\",\"skillName\":\"lesson\",\"cueId\":\"voice.practice-cushion.ult.release\",\"text\":\"Good practice!\",\"durationMs\":1384,\"syncPointMs\":40},{\"unitId\":\"pollen-scout\",\"kind\":\"skill\",\"skillId\":\"enemy:pollen-scout:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.pollen-scout.skill.enemy:pollen-scout:basic\",\"text\":\"Seed shot!\",\"durationMs\":1340,\"syncPointMs\":40},{\"unitId\":\"pollen-scout\",\"kind\":\"skill\",\"skillId\":\"enemy:pollen-scout\",\"skillName\":\"summon\",\"slot\":2,\"cueId\":\"voice.pollen-scout.skill.enemy:pollen-scout\",\"text\":\"Rise, little roots!\",\"durationMs\":1732,\"syncPointMs\":40},{\"unitId\":\"pollen-scout\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:pollen-scout\",\"skillName\":\"summon\",\"cueId\":\"voice.pollen-scout.ult.charge\",\"text\":\"Pollen!\",\"durationMs\":960,\"syncPointMs\":95},{\"unitId\":\"pollen-scout\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:pollen-scout\",\"skillName\":\"summon\",\"cueId\":\"voice.pollen-scout.ult.release\",\"text\":\"A storm of seeds!\",\"durationMs\":1603,\"syncPointMs\":40},{\"unitId\":\"rain-spool\",\"kind\":\"skill\",\"skillId\":\"enemy:rain-spool:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.rain-spool.skill.enemy:rain-spool:basic\",\"text\":\"Rain strike!\",\"durationMs\":1361,\"syncPointMs\":40},{\"unitId\":\"rain-spool\",\"kind\":\"skill\",\"skillId\":\"enemy:rain-spool\",\"skillName\":\"storm\",\"slot\":2,\"cueId\":\"voice.rain-spool.skill.enemy:rain-spool\",\"text\":\"Rain falls!\",\"durationMs\":1435,\"syncPointMs\":40},{\"unitId\":\"rain-spool\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:rain-spool\",\"skillName\":\"storm\",\"cueId\":\"voice.rain-spool.ult.charge\",\"text\":\"Storm!\",\"durationMs\":1168,\"syncPointMs\":95},{\"unitId\":\"rain-spool\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:rain-spool\",\"skillName\":\"storm\",\"cueId\":\"voice.rain-spool.ult.release\",\"text\":\"Storm breaks!\",\"durationMs\":1720,\"syncPointMs\":40},{\"unitId\":\"crumb-sentinel\",\"kind\":\"skill\",\"skillId\":\"enemy:crumb-sentinel:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.crumb-sentinel.skill.enemy:crumb-sentinel:basic\",\"text\":\"Crust strike!\",\"durationMs\":1338,\"syncPointMs\":40},{\"unitId\":\"crumb-sentinel\",\"kind\":\"skill\",\"skillId\":\"enemy:crumb-sentinel\",\"skillName\":\"bomb\",\"slot\":2,\"cueId\":\"voice.crumb-sentinel.skill.enemy:crumb-sentinel\",\"text\":\"Sweet blast!\",\"durationMs\":1527,\"syncPointMs\":40},{\"unitId\":\"crumb-sentinel\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:crumb-sentinel\",\"skillName\":\"bomb\",\"cueId\":\"voice.crumb-sentinel.ult.charge\",\"text\":\"All together now!\",\"durationMs\":1583,\"syncPointMs\":95},{\"unitId\":\"crumb-sentinel\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:crumb-sentinel\",\"skillName\":\"bomb\",\"cueId\":\"voice.crumb-sentinel.ult.release\",\"text\":\"All to crumbs!\",\"durationMs\":1431,\"syncPointMs\":40},{\"unitId\":\"pantry-crown\",\"kind\":\"skill\",\"skillId\":\"enemy:pantry-crown:basic\",\"skillName\":\"Basic\",\"slot\":1,\"cueId\":\"voice.pantry-crown.skill.enemy:pantry-crown:basic\",\"text\":\"Empty plates!\",\"durationMs\":1451,\"syncPointMs\":40},{\"unitId\":\"pantry-crown\",\"kind\":\"skill\",\"skillId\":\"enemy:pantry-crown\",\"skillName\":\"banquet\",\"slot\":2,\"cueId\":\"voice.pantry-crown.skill.enemy:pantry-crown\",\"text\":\"Take their feast!\",\"durationMs\":1456,\"syncPointMs\":40},{\"unitId\":\"pantry-crown\",\"kind\":\"ultimate\",\"phase\":\"charge\",\"skillId\":\"enemy:pantry-crown\",\"skillName\":\"banquet\",\"cueId\":\"voice.pantry-crown.ult.charge\",\"text\":\"All is mine!\",\"durationMs\":1438,\"syncPointMs\":95},{\"unitId\":\"pantry-crown\",\"kind\":\"ultimate\",\"phase\":\"release\",\"skillId\":\"enemy:pantry-crown\",\"skillName\":\"banquet\",\"cueId\":\"voice.pantry-crown.ult.release\",\"text\":\"Mine to claim!\",\"durationMs\":1340,\"syncPointMs\":40}]"), s = new Map(o.map((e) => [e.cueId, e])), c = [...new Set(o.map((e) => e.unitId))];
function l(e) {
	return c.find((t) => e === t || e.replace(/^(?:party|cat)[-:]/, "") === t || e.replace(/^foe-\d+-/, "") === t);
}
function u(e) {
	return s.get(e);
}
function d(e) {
	let t = /^ult\.(.+)\.(charge|release)$/.exec(e);
	if (t) {
		let e = `voice.${l(t[1])}.ult.${t[2]}`;
		return s.has(e) ? e : void 0;
	}
	let n = /^skill\.(.+)\.(\d+)\.cast$/.exec(e);
	if (!n) return;
	let r = l(n[1]);
	return o.find((e) => e.unitId === r && e.kind === "skill" && e.slot === Number(n[2]))?.cueId;
}
// apps/web/src/audio/variants.ts
var f = class {
	random;
	cursors = /* @__PURE__ */ new Map();
	previous = /* @__PURE__ */ new Map();
	constructor(e = Math.random) {
		this.random = e;
	}
	next(e, t, n = (e) => e) {
		if (!t.length) throw Error(`Empty audio pool: ${e}`);
		let r = (this.cursors.get(e) ?? Math.min(t.length - 1, Math.floor(this.random() * t.length))) % t.length;
		for (let i = 0; i < t.length - 1 && this.previous.get(e) === n(t[r]); i++) r = (r + 1) % t.length;
		return this.cursors.set(e, (r + 1) % t.length), this.previous.set(e, n(t[r])), t[r];
	}
	reset() {
		this.cursors.clear(), this.previous.clear();
	}
}, p = (e) => 10 ** (e / 20), m = (e, t) => e[0] + t() * (e[1] - e[0]), h = "tbh-audio-v3", g = {
	master: .7,
	music: .55,
	ambience: .3,
	sfx: .8,
	voice: .7,
	ui: .6
}, _ = class {
	random;
	assetBase;
	ctx;
	mixTrim;
	buses = /* @__PURE__ */ new Map();
	duck;
	speechSpace;
	tones = /* @__PURE__ */ new Map();
	voiceBody;
	buffers = /* @__PURE__ */ new Map();
	manifest;
	active = /* @__PURE__ */ new Set();
	last = /* @__PURE__ */ new Map();
	pools;
	group = 0;
	epoch = 0;
	stopped = /* @__PURE__ */ new Map();
	voiceRequest = 0;
	pendingVoicePriority = 0;
	voicePriority = 0;
	lastVoiceRequested = -Infinity;
	calloutRequests = /* @__PURE__ */ new Map();
	bedTokens = {
		music: 0,
		ambience: 0
	};
	bedIds = {
		music: "",
		ambience: ""
	};
	paused = !1;
	rate = 1;
	speechCutDb = 0;
	musicScopes = [];
	musicScopeBase = "";
	preferences = { ...g };
	muted = !1;
	hits = [];
	constructor(e = Math.random, n = "/audio/") {
		this.random = e, this.assetBase = n, this.pools = new f(e);
		try {
			let e = JSON.parse(localStorage.getItem(h) ?? "null");
			for (let n of t) Number.isFinite(e?.[n]) && (this.preferences[n] = Math.max(0, Math.min(1, e[n])));
			this.muted = e?.muted === !0;
		} catch {}
	}
	get ready() {
		return this.ctx?.state === "running";
	}
	get settings() {
		return { ...this.preferences };
	}
	get diagnostics() {
		return {
			active: this.active.size,
			sfx: this.count("sfx"),
			voice: this.count("voice"),
			packs: [...this.buffers.keys()]
		};
	}
	count(e) {
		let t = 0;
		for (let n of this.active) n.bus === e && t++;
		return t;
	}
	remember() {
		try {
			localStorage.setItem(h, JSON.stringify({
				...this.preferences,
				muted: this.muted
			}));
		} catch {}
		typeof window < "u" && window.dispatchEvent(new Event("audio:changed"));
	}
	async unlock() {
		if (this.ctx ??= new AudioContext(), !this.buses.size) {
			let e = this.ctx.createDynamicsCompressor();
			e.threshold.value = -4, e.knee.value = 6, e.ratio.value = 20, e.attack.value = .002, e.release.value = .15;
			let n = this.ctx.createGain();
			n.gain.value = p(-2.25), e.connect(n).connect(this.ctx.destination);
			let r = this.ctx.createGain();
			this.mixTrim = r, r.gain.value = p(6), r.connect(e);
			for (let e of t) {
				let t = this.ctx.createGain();
				t.gain.value = e === "master" && this.muted ? 0 : this.preferences[e], this.buses.set(e, t);
			}
			this.buses.get("master").connect(r), this.duck = this.ctx.createGain(), this.duck.connect(this.buses.get("master")), this.speechSpace = this.ctx.createBiquadFilter(), this.speechSpace.type = "lowshelf", this.speechSpace.frequency.value = 1200, this.speechSpace.gain.value = 0, this.speechSpace.connect(this.duck);
			for (let e of t.slice(1)) {
				let t = e === "music" ? this.speechSpace : this.buses.get("master");
				if (e === "voice" || e === "sfx" || e === "music") {
					let n = this.ctx.createBiquadFilter();
					n.type = "highshelf", n.frequency.value = 1500, n.gain.value = 0, this.tones.set(e, n), e === "voice" ? (this.voiceBody = this.ctx.createBiquadFilter(), this.voiceBody.type = "lowshelf", this.voiceBody.frequency.value = 500, this.voiceBody.gain.value = 0, this.buses.get(e).connect(this.voiceBody).connect(n).connect(t)) : this.buses.get(e).connect(n).connect(t);
				} else this.buses.get(e).connect(t);
			}
			this.setSceneTone();
		}
		await this.ctx.resume(), this.paused = !1, this.remember();
	}
	assetUrl(e) {
		return e.startsWith("/audio/") ? this.assetBase + e.slice(7) : e;
	}
	loadManifest() {
		return this.manifest ??= fetch(this.assetUrl("/audio/manifest.json")).then((e) => {
			if (!e.ok) throw Error("Audio manifest unavailable");
			return e.json();
		}).catch((e) => {
			throw this.manifest = void 0, e;
		});
	}
	buffer(e, t) {
		return this.buffers.has(e) || this.buffers.set(e, (async () => {
			let n = t.packs[e];
			if (!n) throw Error(`Unknown audio pack: ${e}`);
			for (let e of ["webm", "mp3"]) try {
				let t = await fetch(this.assetUrl(n[e]));
				if (!t.ok) continue;
				return await this.ctx.decodeAudioData(await t.arrayBuffer());
			} catch {}
			throw Error(`Audio pack ${e} unavailable`);
		})().catch((t) => {
			throw this.buffers.delete(e), t;
		})), this.buffers.get(e);
	}
	async preload(e) {
		if (this.ctx) try {
			let t = await this.loadManifest(), n = a(`music.${e}`, t)?.[0]?.pack, r = e === "battle" ? [
				"b2-hits",
				"b2-motion",
				"b2-magic",
				"b2-ui",
				...n ? [n] : []
			] : ["b2-ui", ...n ? [n] : []];
			await Promise.all(r.filter((e) => t.packs[e]).map((e) => this.buffer(e, t)));
		} catch {}
	}
	record(e, t, n) {
		this.hits.push({
			id: e,
			result: t,
			at: Date.now(),
			...n ? {
				layers: n,
				sfx: this.count("sfx"),
				voice: this.count("voice"),
				duckDb: this.count("voice") || e.startsWith("ult.") ? -8 : 0
			} : {}
		}), this.hits.length > 12e3 && this.hits.splice(0, 1e3);
	}
	setBus(e, n) {
		if (!t.includes(e) || !Number.isFinite(n)) return;
		let r = e;
		this.preferences[r] = Math.max(0, Math.min(1, n)), this.buses.get(r)?.gain.setTargetAtTime(r === "master" && this.muted ? 0 : this.preferences[r], this.ctx.currentTime, .025), this.remember();
	}
	mute(e) {
		this.muted = e, this.buses.get("master")?.gain.setTargetAtTime(e ? 0 : this.preferences.master, this.ctx.currentTime, .025), this.remember();
	}
	pause(e) {
		this.paused = e, e ? this.ctx?.suspend() : this.ctx?.resume().catch(() => {});
	}
	speed(e) {
		if (Number.isFinite(e)) {
			this.rate = Math.max(1, Math.min(3, e));
			for (let e of this.active) e.bus === "sfx" && e.source.playbackRate.setValueAtTime(e.baseRate * this.rate, this.ctx.currentTime);
		}
	}
	makeSpeechSpace() {
		if (!this.ctx || !this.speechSpace) return;
		let e = this.count("voice") > 0, t = this.bedIds.music === "music.boss", n = e ? this.bedIds.music === "music.battle" ? -9 : t ? -8 : this.bedIds.music === "music.home" ? -9 : -6 : 0, r = t ? "peaking" : "lowshelf";
		if (n === this.speechCutDb && this.speechSpace.type === r) return;
		this.speechCutDb = n, this.speechSpace.type = r, this.speechSpace.frequency.value = t ? 1700 : 1200, this.speechSpace.Q.value = .7;
		let i = this.speechSpace.gain, a = this.ctx.currentTime;
		i.cancelScheduledValues(a), i.setValueAtTime(i.value, a), i.linearRampToValueAtTime(n, a + (e ? .06 : .4));
	}
	setSceneTone() {
		if (!this.ctx) return;
		let e = this.bedIds.music, t = e === "music.battle" ? {
			voice: -3,
			sfx: -12,
			music: 9
		} : e === "music.boss" ? {
			sfx: -12,
			music: 6
		} : e === "music.forge" ? { music: -9 } : e === "music.gacha" ? { music: 3 } : {};
		for (let [e, n] of this.tones) {
			let r = n.gain, i = this.ctx.currentTime;
			r.cancelScheduledValues(i), r.setValueAtTime(r.value, i), r.linearRampToValueAtTime(t[e] ?? 0, i + .15);
		}
		if (this.voiceBody) {
			let t = this.voiceBody.gain, n = this.ctx.currentTime;
			t.cancelScheduledValues(n), t.setValueAtTime(t.value, n), t.linearRampToValueAtTime(e === "music.boss" ? -6 : 0, n + .15);
		}
		if (this.mixTrim) {
			let t = this.mixTrim.gain, n = this.ctx.currentTime;
			t.cancelScheduledValues(n), t.setValueAtTime(t.value, n), t.linearRampToValueAtTime(p(e === "music.battle" ? 2.8 : e === "music.boss" ? 4.5 : 6), n + .15);
		}
	}
	duckMusic() {
		if (!this.ctx || !this.duck) return;
		this.makeSpeechSpace();
		let e = this.duck.gain, t = this.ctx.currentTime;
		e.cancelScheduledValues(t), e.setValueAtTime(e.value, t), e.linearRampToValueAtTime(p(-8), t + .12);
	}
	releaseDuck() {
		if (this.makeSpeechSpace(), !this.ctx || !this.duck || [...this.active].some((e) => e.bus === "voice" || e.id.startsWith("ult."))) return;
		let e = this.duck.gain, t = this.ctx.currentTime;
		e.cancelScheduledValues(t), e.setValueAtTime(e.value, t), e.linearRampToValueAtTime(1, t + .4);
	}
	play(e, t = {}) {
		let n = Date.now();
		if (e.startsWith("voice.") && (this.lastVoiceRequested = n, u(e))) {
			if (n - (this.calloutRequests.get(e) ?? -Infinity) < 300) {
				this.record(e, "duplicate");
				return;
			}
			this.calloutRequests.set(e, n);
		}
		this.perform(e, t);
		let r = d(e), i = this.epoch;
		r && this.record(e, "cast"), r && queueMicrotask(() => {
			i === this.epoch && Date.now() - this.lastVoiceRequested >= 300 && this.play(r);
		});
	}
	async perform(e, t) {
		if (!this.ctx || this.paused) {
			this.record(e, "locked");
			return;
		}
		if (this.muted) {
			this.record(e, "muted");
			return;
		}
		let n = this.epoch, o = this.stopped.get(e) ?? 0, s = 0;
		try {
			let c = await this.loadManifest(), l = i(e, c, t.element), d = a(e, c, t.element);
			if (!d?.length && !l) {
				this.record(e, "unmapped");
				return;
			}
			let f = l?.bus ?? d[0].bus, h = t.priority ?? (f === "voice" ? /\.ult(?:\.|$)/.test(e) ? 100 : e.includes(".skill") ? 90 : e.endsWith(".death") ? 80 : e.endsWith(".hit") ? 50 : 40 : l?.priority ?? 20);
			if (f === "voice") {
				if (Math.max(this.pendingVoicePriority, this.voicePriority) > h) {
					this.record(e, "priority");
					return;
				}
				this.pendingVoicePriority = h, s = ++this.voiceRequest;
			}
			let g = l ? l.baked?.map((e) => e.sample) ?? l.layers.flatMap((e) => e.variants) : d, _ = [...new Set(g.map((e) => e.pack))], v = new Map(await Promise.all(_.map(async (e) => [e, await this.buffer(e, c)])));
			if (this.paused || this.muted || n !== this.epoch || o !== (this.stopped.get(e) ?? 0)) return;
			if (f === "voice" && s !== this.voiceRequest) {
				this.record(e, "superseded");
				return;
			}
			let y = this.ctx.currentTime * 1e3;
			if (y - (this.last.get(e) ?? -Infinity) < (l?.cooldownMs ?? 30)) {
				this.record(e, "cooldown");
				return;
			}
			let b = u(e)?.kind === "ultimate";
			if (f === "voice" && !b && y - (this.last.get("voice-cadence") ?? -Infinity) < 7e3) {
				this.record(e, "cadence");
				return;
			}
			let x = l?.baked ? 1 : l?.layers.length ?? 1;
			if (!this.admit(f, x, h)) {
				this.record(e, "limit");
				return;
			}
			if (f === "voice" && (this.stopBus("voice"), this.voicePriority = h, this.last.set("voice-cadence", y)), f === "ambience") {
				this.ambience(e);
				return;
			}
			this.last.set(e, y);
			let S = ++this.group, C = [], w = Number.isFinite(t.pitch) ? Math.max(.25, Math.min(4, t.pitch)) : 1, T = f === "voice" ? this.bedIds.music === "music.battle" || this.bedIds.music === "music.boss" ? 3 : this.bedIds.music === "music.forge" || this.bedIds.music === "music.home" ? 5 : 3 : f === "sfx" ? e.startsWith("move.") ? -7 : -4 : e === "ui.hover" ? 6 : 0, E = (Number.isFinite(t.volume) ? Math.max(0, Math.min(2, t.volume)) : 1) * p(T);
			if (l?.baked) {
				let t = this.pools.next(`${e}/baked`, l.baked, (e) => e.sample.variantId ?? `${e.sample.pack}:${e.sample.start}`), n = m(l.pitchRange, this.random), r = m(l.gainRange, this.random);
				this.start(e, v.get(t.sample.pack), t.sample, h, w * n, E * p(r), 0, "flat", S), C.push(...t.layers.map((e) => ({
					...e,
					pitch: w * n,
					gainDb: r + T
				})));
			} else if (l) for (let t of l.layers) {
				let n = this.pools.next(`${e}/${t.role}`, t.variants, (e) => e.variantId ?? `${e.pack}:${e.start}`), r = w * m(l.pitchRange, this.random), i = t.gainDb + m(l.gainRange, this.random), a = f === "sfx" ? t.role === "transient" ? -9 : t.role === "sweetener" ? -7 : t.role === "body" ? 3 : 1 : 0;
				this.start(e, v.get(n.pack), n, h, r, E * p(i + a), t.offsetMs / 1e3, t.eq, S), C.push({
					role: t.role,
					variantId: n.variantId ?? `${n.pack}:${n.start}`,
					offsetMs: t.offsetMs,
					pitch: r,
					gainDb: i + T + a
				});
			}
			else {
				let t = this.pools.next(e, d, (e) => e.variantId ?? `${e.pack}:${e.start}`), n = f === "voice" ? r[e.split(".")[1]] ?? r.mochi : void 0, i = w * (t.processedVoice ? 1 : n?.pitch ?? 1);
				this.start(e, v.get(t.pack), t, h, i, E, 0, "flat", S), C.push({
					role: f,
					variantId: t.variantId ?? `${t.pack}:${t.start}`,
					offsetMs: 0,
					pitch: i,
					gainDb: T
				});
			}
			l?.ducking && this.duckMusic(), this.record(e, "played", C);
		} catch {
			this.record(e, "unavailable");
		} finally {
			s === this.voiceRequest && (this.pendingVoicePriority = 0);
		}
	}
	admit(e, t, n) {
		if (e === "voice") return t === 1;
		let r = e === "sfx" ? 14 : e === "ui" ? 8 : Infinity;
		if (t > r) return !1;
		for (; this.count(e) + t > r;) {
			let t = [...this.active].filter((t) => t.bus === e && t.priority <= n).sort((e, t) => e.priority - t.priority || e.group - t.group)[0];
			if (!t) return !1;
			for (let e of this.active) e.group === t.group && this.end(e, !0);
		}
		return !0;
	}
	start(e, t, n, r, i, a, o, s, c) {
		let l = this.ctx, u = l.createBufferSource(), d = l.createGain();
		u.buffer = t;
		let f = i * (n.bus === "sfx" ? this.rate : 1);
		u.playbackRate.value = f, d.gain.value = a;
		let p = l.currentTime + o, m = n.duration / f;
		u.connect(d);
		let h;
		s === "flat" ? d.connect(this.buses.get(n.bus)) : (h = l.createBiquadFilter(), h.type = s === "low-shelf-180" ? "lowshelf" : "highpass", h.frequency.value = s === "low-shelf-180" ? 180 : s === "high-pass-1800" ? 1800 : 80, h.Q.value = .7, h.gain.value = s === "low-shelf-180" ? 3 : 0, d.connect(h).connect(this.buses.get(n.bus)));
		let g = {
			id: e,
			source: u,
			gain: d,
			filter: h,
			bus: n.bus,
			priority: r,
			group: c,
			baseRate: i,
			ended: !1
		};
		if (this.active.add(g), u.onended = () => this.end(g, !1), n.loop) u.loop = !0, u.loopStart = n.start, u.loopEnd = n.start + n.duration, u.start(p, n.start);
		else {
			let t = e.startsWith("move."), r = Math.min(t ? .035 : .003, m * .3), i = Math.min(t ? .04 : .015, m * .3);
			d.gain.setValueAtTime(0, p), d.gain.linearRampToValueAtTime(a, p + r), d.gain.setValueAtTime(a, p + m - i), d.gain.linearRampToValueAtTime(0, p + m), u.start(p, n.start, n.duration);
		}
		return (n.bus === "voice" || e.startsWith("ult.")) && this.duckMusic(), g;
	}
	end(e, t) {
		e.ended || (e.ended = !0, t && e.source.stop(), e.source.disconnect(), e.gain.disconnect(), e.filter?.disconnect(), this.active.delete(e), this.count("voice") || (this.voicePriority = 0), this.releaseDuck());
	}
	stopBus(e) {
		for (let t of this.active) t.bus === e && this.end(t, !0);
	}
	stop(e) {
		e ? this.stopped.set(e, (this.stopped.get(e) ?? 0) + 1) : (this.epoch++, this.voiceRequest++, this.pendingVoicePriority = 0);
		for (let t of this.active) e && t.id !== e || this.end(t, !0);
		for (let t of ["music", "ambience"]) e && e !== this.bedIds[t] || (this.bedIds[t] = "", this.bedTokens[t]++);
		this.setSceneTone(), this.releaseDuck();
	}
	music(e) {
		this.musicScopes = [], this.bed("music", e);
	}
	musicScope(e) {
		this.musicScopes.length || (this.musicScopeBase = this.bedIds.music);
		let t = Symbol(e);
		return this.musicScopes.push({
			key: t,
			id: e
		}), this.bed("music", e), () => {
			let e = this.musicScopes.findIndex((e) => e.key === t);
			if (e < 0) return;
			this.musicScopes.splice(e, 1);
			let n = this.musicScopes.at(-1)?.id ?? this.musicScopeBase;
			n ? this.bed("music", n) : this.stop(this.bedIds.music);
		};
	}
	ambience(e) {
		this.bed("ambience", e);
	}
	bed(e, t) {
		let n = t.startsWith(`${e}.`) ? t : `${e}.${t}`;
		if (n === this.bedIds[e]) return;
		this.bedIds[e] = n, e === "music" && this.setSceneTone();
		let r = ++this.bedTokens[e];
		(async () => {
			try {
				let t = await this.loadManifest(), i = a(n, t)?.[0];
				if (!i || !this.ctx) {
					r === this.bedTokens[e] && (this.bedIds[e] = "", this.setSceneTone());
					return;
				}
				let o = await this.buffer(i.pack, t);
				if (r !== this.bedTokens[e]) return;
				let s = this.ctx.currentTime;
				for (let t of this.active) t.bus === e && (t.gain.gain.cancelScheduledValues(s), t.gain.gain.setValueAtTime(t.gain.gain.value, s), t.gain.gain.linearRampToValueAtTime(0, s + .8), t.source.stop(s + .82));
				let c = p(["music.battle", "music.boss"].includes(n) ? 3 : 0), l = this.start(n, o, i, 0, 1, c, 0, "flat", ++this.group);
				l.gain.gain.setValueAtTime(0, s), l.gain.gain.linearRampToValueAtTime(c, s + .8), this.record(n, "played");
			} catch {
				r === this.bedTokens[e] && (this.bedIds[e] = "", this.setSceneTone()), this.record(n, "unavailable");
			}
		})();
	}
};
new _();
export { _ as AudioEngine, a as resolveCue, i as resolveDesign };
