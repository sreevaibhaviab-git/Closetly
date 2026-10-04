import type { WardrobeItem } from "@/lib/supabase/wardrobe";

export type VacationOutfit = {
  id: string;
  title: string;
  label: string;
  items: WardrobeItem[];
  reason: string;
  stylingTip: string;
  confidence: number;
};

type GenerateVacationOutfitsInput = {
  wardrobe: WardrobeItem[];
  destination: string;
  tripType: string;
  notes: string;
};

export function generateVacationOutfits({
  wardrobe,
  destination,
  tripType,
  notes,
}: GenerateVacationOutfitsInput): VacationOutfit[] {
  const suitableWardrobe = wardrobe.filter((item) =>
    isSuitableVacationItem(item, tripType, notes)
  );

  const outfits: VacationOutfit[] = [];

  const travelLook = buildTravelLook(
    suitableWardrobe,
    destination,
    tripType
  );

  if (travelLook) {
    outfits.push(travelLook);
  }

  const daytimeLook = buildDaytimeLook(
    suitableWardrobe,
    destination,
    tripType
  );

  if (
    daytimeLook &&
    !hasSameItems(daytimeLook, outfits)
  ) {
    outfits.push(daytimeLook);
  }

  const dinnerLook = buildDinnerLook(
    suitableWardrobe,
    destination,
    tripType
  );

  if (
    dinnerLook &&
    !hasSameItems(dinnerLook, outfits)
  ) {
    outfits.push(dinnerLook);
  }

  return outfits.slice(0, 3);
}

function buildTravelLook(
  wardrobe: WardrobeItem[],
  destination: string,
  tripType: string
): VacationOutfit | null {
  const top = chooseBest(
    wardrobe,
    "Top",
    [
      "shirt",
      "t-shirt",
      "tee",
      "cotton",
      "casual",
      "oversized",
      "linen",
    ],
    ["bridal", "formal gown", "party"]
  );

  const bottom = chooseBest(
    wardrobe,
    "Bottom",
    [
      "jeans",
      "trouser",
      "pants",
      "wide leg",
      "straight",
      "comfortable",
      "casual",
    ],
    ["sequin", "bridal"]
  );

  const dress = chooseBest(
    wardrobe,
    "Dress",
    [
      "casual",
      "cotton",
      "shirt dress",
      "maxi",
      "travel",
    ],
    ["bridal", "wedding", "gown", "ball gown"]
  );

  const shoes = chooseBest(
    wardrobe,
    "Shoes",
    [
      "sneaker",
      "trainer",
      "loafer",
      "flat",
      "comfortable",
    ],
    ["heel", "stiletto", "bridal"]
  );

  const bag = chooseBest(
    wardrobe,
    "Bag",
    [
      "tote",
      "crossbody",
      "shoulder",
      "backpack",
    ],
    []
  );

  const items =
    top && bottom
      ? compactItems([top, bottom, shoes, bag])
      : compactItems([dress, shoes, bag]);

  if (items.length < 2) {
    return null;
  }

  return {
    id: createOutfitId("travel", items),
    title: `${destination || "Vacation"} Travel Look`,
    label: "Travel outfit",
    items,
    reason:
      "This look prioritises comfort, movement and easy layering while still feeling polished enough for travel photos and arrival plans.",
    stylingTip:
      tripType === "Cold-weather trip"
        ? "Keep a jacket within reach and use light layers so the outfit stays comfortable indoors and outdoors."
        : "Use the bag for travel essentials and keep jewellery minimal for an effortless airport-ready finish.",
    confidence: calculateConfidence(items, 4),
  };
}

function buildDaytimeLook(
  wardrobe: WardrobeItem[],
  destination: string,
  tripType: string
): VacationOutfit | null {
  const beachTrip = tripType === "Beach holiday";

  const top = chooseBest(
    wardrobe,
    "Top",
    beachTrip
      ? [
          "linen",
          "cotton",
          "tank",
          "crop",
          "summer",
          "light",
          "shirt",
        ]
      : [
          "casual",
          "cotton",
          "linen",
          "blouse",
          "shirt",
          "light",
        ],
    ["bridal", "heavy wool", "formal"]
  );

  const bottom = chooseBest(
    wardrobe,
    "Bottom",
    beachTrip
      ? [
          "shorts",
          "linen",
          "skirt",
          "light",
          "wide leg",
        ]
      : [
          "jeans",
          "trouser",
          "skirt",
          "casual",
          "wide leg",
        ],
    ["bridal", "sequin"]
  );

  const dress = chooseBest(
    wardrobe,
    "Dress",
    beachTrip
      ? [
          "summer",
          "cotton",
          "linen",
          "maxi",
          "casual",
          "floral",
        ]
      : [
          "day",
          "casual",
          "shirt dress",
          "floral",
          "cotton",
        ],
    [
      "bridal",
      "wedding gown",
      "ball gown",
      "ceremonial",
    ]
  );

  const shoes = chooseBest(
    wardrobe,
    "Shoes",
    beachTrip
      ? ["sandal", "flat", "slide", "sneaker"]
      : ["sneaker", "loafer", "flat", "sandal"],
    ["bridal", "stiletto"]
  );

  const bag = chooseBest(
    wardrobe,
    "Bag",
    [
      "crossbody",
      "shoulder",
      "woven",
      "tote",
      "small",
    ],
    []
  );

  const accessory = chooseBest(
    wardrobe,
    "Accessory",
    [
      "sunglass",
      "scarf",
      "hat",
      "belt",
    ],
    []
  );

  const items =
    dress && scoreItem(dress, ["summer", "casual", "day"]) > 0
      ? compactItems([dress, shoes, bag, accessory])
      : compactItems([
          top,
          bottom,
          shoes,
          bag,
          accessory,
        ]);

  if (items.length < 2) {
    return null;
  }

  return {
    id: createOutfitId("day", items),
    title: `${destination || "Vacation"} Day Look`,
    label: "Daytime outfit",
    items,
    reason: beachTrip
      ? "The lighter fabrics and relaxed silhouettes make this practical for warm weather while keeping the overall look coordinated."
      : "This combination feels relaxed enough for sightseeing and cafés while still looking intentional in photos.",
    stylingTip: beachTrip
      ? "Keep the styling breathable and add sunglasses or a woven bag for an easy holiday finish."
      : "Use a simple front tuck or rolled sleeves to make the outfit feel more styled without becoming overdressed.",
    confidence: calculateConfidence(items, 5),
  };
}

function buildDinnerLook(
  wardrobe: WardrobeItem[],
  destination: string,
  tripType: string
): VacationOutfit | null {
  const dress = chooseBest(
    wardrobe,
    "Dress",
    [
      "midi",
      "slip",
      "evening",
      "dinner",
      "elegant",
      "satin",
      "wrap",
      "maxi",
    ],
    [
      "bridal",
      "wedding gown",
      "bride",
      "ball gown",
      "ceremonial",
    ]
  );

  const top = chooseBest(
    wardrobe,
    "Top",
    [
      "blouse",
      "fitted",
      "satin",
      "wrap",
      "elegant",
      "dressy",
    ],
    ["bridal", "gym", "sports"]
  );

  const bottom = chooseBest(
    wardrobe,
    "Bottom",
    [
      "trouser",
      "skirt",
      "tailored",
      "wide leg",
      "dark",
      "dressy",
    ],
    ["shorts", "sports", "bridal"]
  );

  const shoes = chooseBest(
    wardrobe,
    "Shoes",
    [
      "heel",
      "sandal",
      "loafer",
      "mule",
      "elegant",
      "dressy",
    ],
    ["running", "gym", "bridal"]
  );

  const bag = chooseBest(
    wardrobe,
    "Bag",
    [
      "clutch",
      "shoulder",
      "mini",
      "evening",
      "structured",
    ],
    ["backpack", "gym"]
  );

  const jewelry = chooseBest(
    wardrobe,
    "Jewelry",
    [
      "gold",
      "silver",
      "earring",
      "necklace",
      "bracelet",
    ],
    []
  );

  const items = dress
    ? compactItems([dress, shoes, bag, jewelry])
    : compactItems([
        top,
        bottom,
        shoes,
        bag,
        jewelry,
      ]);

  if (items.length < 2) {
    return null;
  }

  return {
    id: createOutfitId("dinner", items),
    title: `${destination || "Vacation"} Dinner Look`,
    label: "Dinner outfit",
    items,
    reason:
      "This look is more elevated than the daytime combinations, but it remains practical enough for a relaxed holiday dinner.",
    stylingTip:
      tripType === "Beach holiday"
        ? "Keep hair and makeup soft, and let one accessory or piece of jewellery provide the polished final detail."
        : "Add one refined accessory and keep the remaining styling clean so the outfit feels elegant rather than busy.",
    confidence: calculateConfidence(items, 5),
  };
}

function chooseBest(
  wardrobe: WardrobeItem[],
  category: string,
  preferredWords: string[],
  rejectedWords: string[]
): WardrobeItem | null {
  const items = wardrobe.filter(
    (item) => item.category === category
  );

  const allowedItems = items.filter((item) => {
    const text = getItemText(item);

    return !rejectedWords.some((word) =>
      text.includes(word)
    );
  });

  const sorted = [...allowedItems].sort((a, b) => {
    const favoriteDifference =
      Number(b.is_favorite) - Number(a.is_favorite);

    if (favoriteDifference !== 0) {
      return favoriteDifference;
    }

    return (
      scoreItem(b, preferredWords) -
      scoreItem(a, preferredWords)
    );
  });

  return sorted[0] || null;
}

function scoreItem(
  item: WardrobeItem,
  words: string[]
) {
  const text = getItemText(item);

  return words.reduce(
    (score, word) =>
      text.includes(word) ? score + 1 : score,
    0
  );
}

function getItemText(item: WardrobeItem) {
  return [
    item.name,
    item.category,
    item.color,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isSuitableVacationItem(
  item: WardrobeItem,
  tripType: string,
  notes: string
) {
  if (item.is_in_laundry) {
    return false;
  }

  const text = `${getItemText(item)} ${notes}`.toLowerCase();

  const bridalWords = [
    "bridal",
    "wedding gown",
    "wedding dress",
    "bride",
    "ball gown",
  ];

  const isBridal = bridalWords.some((word) =>
    text.includes(word)
  );

  if (isBridal && tripType !== "Wedding trip") {
    return false;
  }

  if (
    tripType === "Beach holiday" &&
    [
      "heavy coat",
      "thermal",
      "thick wool",
      "snow boot",
    ].some((word) => text.includes(word))
  ) {
    return false;
  }

  if (
    tripType !== "Cold-weather trip" &&
    [
      "thermal",
      "snow boot",
      "puffer coat",
    ].some((word) => text.includes(word))
  ) {
    return false;
  }

  return true;
}

function compactItems(
  items: Array<WardrobeItem | null>
) {
  return Array.from(
    new Map(
      items
        .filter(
          (item): item is WardrobeItem =>
            item !== null
        )
        .map((item) => [item.id, item])
    ).values()
  );
}

function calculateConfidence(
  items: WardrobeItem[],
  idealCount: number
) {
  const base = 68;
  const completeness = Math.min(
    22,
    Math.round((items.length / idealCount) * 22)
  );
  const favoriteBonus = items.some(
    (item) => item.is_favorite
  )
    ? 6
    : 0;

  return Math.min(
    96,
    base + completeness + favoriteBonus
  );
}

function createOutfitId(
  type: string,
  items: WardrobeItem[]
) {
  return `${type}-${items
    .map((item) => item.id)
    .sort()
    .join("-")}`;
}

function hasSameItems(
  outfit: VacationOutfit,
  existing: VacationOutfit[]
) {
  const currentIds = [...outfit.items]
    .map((item) => item.id)
    .sort()
    .join("|");

  return existing.some((savedOutfit) => {
    const savedIds = [...savedOutfit.items]
      .map((item) => item.id)
      .sort()
      .join("|");

    return currentIds === savedIds;
  });
}