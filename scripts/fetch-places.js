#!/usr/bin/env node
// Saves our Google Maps list of places to eat in London to public/places.json.
//
//   yarn places
//
// The list is shared by link, and Google Maps loads a shared list from the getlist endpoint below,
// which needs no key. Google doesn't say what kind of place each one is, so that comes from
// scripts/place-tags.json (by name). New places without tags are listed at the end so they can be
// added there.

const fs = require("fs");
const path = require("path");

const LIST_ID = "g0lUwENQz9bZmHS9XxgyjYM8Nkz1-w"; // https://maps.app.goo.gl/fgfBsvrhSPUmbPjD8
const LIST_URL =
  "https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=en&gl=uk&pb=" +
  encodeURIComponent(`!1m4!1s${LIST_ID}!2e1!3m1!1e1!2e2!3e2!4i1000!16b1`);

const root = path.join(__dirname, "..");
const outFile = path.join(root, "public", "places.json");
const tags = JSON.parse(fs.readFileSync(path.join(__dirname, "place-tags.json"), "utf8"));

// Neighbourhood names for postcode districts, so "SE15" can be found by searching "Peckham"
const AREAS = {
  E1: "Whitechapel & Spitalfields", E1W: "Wapping", E2: "Bethnal Green", E3: "Bow", E6: "East Ham",
  E8: "Hackney & Dalston", E9: "Hackney", E10: "Leyton", E14: "Canary Wharf & Poplar", E15: "Stratford",
  E17: "Walthamstow", E20: "Olympic Park", E22: "Canary Wharf", EC1A: "Smithfield", EC1M: "Farringdon", EC1N: "Holborn",
  EC1R: "Clerkenwell", EC1V: "Old Street", EC2A: "Shoreditch", EC2M: "Liverpool Street", EC3V: "City",
  EC4M: "St Paul's", EC4N: "Bank", N1: "Islington", N4: "Finsbury Park", N7: "Holloway",
  N16: "Stoke Newington", N17: "Tottenham", NW1: "Camden", NW3: "Hampstead", NW5: "Kentish Town",
  NW6: "Kilburn", NW9: "Colindale", NW10: "Willesden", SE1: "Southwark & Borough",
  SE4: "Brockley", SE5: "Camberwell", SE8: "Deptford", SE11: "Kennington", SE15: "Peckham",
  SE16: "Bermondsey", SE17: "Walworth", SE19: "Crystal Palace", SE21: "Dulwich", SE22: "East Dulwich",
  SE23: "Forest Hill", SE24: "Herne Hill", SE27: "West Norwood", SW1E: "Victoria", SW1V: "Pimlico",
  SW1W: "Belgravia", SW1X: "Knightsbridge", SW1Y: "St James's", SW2: "Brixton Hill", SW3: "Chelsea",
  SW4: "Clapham", SW5: "Earl's Court", SW6: "Fulham", SW7: "South Kensington", SW8: "Vauxhall & Nine Elms",
  SW9: "Brixton", SW11: "Battersea", SW19: "Wimbledon", W1B: "Regent Street", W1D: "Soho",
  W1F: "Soho", W1G: "Marylebone", W1H: "Marylebone", W1J: "Mayfair", W1K: "Mayfair",
  W1S: "Mayfair", W1T: "Fitzrovia", W1U: "Marylebone", W1W: "Fitzrovia", W2: "Bayswater",
  W4: "Chiswick", W5: "Ealing", W6: "Hammersmith", W8: "Kensington", W10: "North Kensington",
  W11: "Notting Hill", W12: "Shepherd's Bush", WC1A: "Bloomsbury", WC1B: "Bloomsbury",
  WC1H: "King's Cross", WC1N: "Bloomsbury", WC1R: "Holborn", WC1V: "Holborn", WC1X: "King's Cross",
  WC2B: "Covent Garden", WC2E: "Covent Garden", WC2H: "Covent Garden", WC2N: "Charing Cross",
  WC2R: "Temple", CR0: "Croydon", KT4: "Worcester Park", SM3: "Cheam",
};

// Which part of London, from the postcode area: W1 and WC are the West End, EC the City
const regionFor = outcode => {
  if (!outcode) return null;
  if (/^(W1|WC|EC)/.test(outcode) || /^SW1|^SE1$|^N1$|^E1$/.test(outcode)) return "Central";
  if (/^(N|NW)\d/.test(outcode)) return "North";
  if (/^E\d/.test(outcode)) return "East";
  if (/^(SE|CR|SM|KT)\d/.test(outcode)) return "South";
  if (/^(SW|W)\d/.test(outcode)) return "West";
  return null;
};

const toUnsigned = id => BigInt.asUintN(64, BigInt(id)).toString();

const main = async () => {
  const response = await fetch(LIST_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Google Maps answered ${response.status}`);
  // The JSON starts with )]}' to stop it being run as a script
  const data = JSON.parse((await response.text()).replace(/^\)\]\}'\s*/, ""));
  const items = data[0][8] ?? [];

  const places = items.map(item => {
    const [, location, name, note, , , , , , addedAt] = item;
    const address = location[4] || null;
    const [lat, lng] = [location[5][2], location[5][3]];
    const outcode = address?.match(/\b([A-Z]{1,2}\d[A-Z\d]?) \d[A-Z]{2}\b/)?.[1] ?? null;
    const [type, cuisine, price] = tags[name] ?? [null, null, null];
    return {
      id: toUnsigned(location[6][1]),
      name,
      type,
      cuisine,
      price,
      address,
      outcode,
      lat,
      lng,
      note: note || null,
      added: addedAt ? new Date(addedAt[0] * 1000).toISOString().slice(0, 10) : null,
    };
  });

  // Some places on the list have no address, so they get the postcode district of the nearest place that has one
  const withOutcode = places.filter(p => p.outcode);
  for (const place of places.filter(p => !p.outcode)) {
    const nearest = withOutcode.reduce((best, p) =>
      (p.lat - place.lat) ** 2 + (p.lng - place.lng) ** 2 < (best.lat - place.lat) ** 2 + (best.lng - place.lng) ** 2 ? p : best);
    place.outcode = nearest.outcode;
  }
  for (const place of places) {
    place.area = AREAS[place.outcode] ?? null;
    place.region = regionFor(place.outcode);
  }

  fs.writeFileSync(outFile, JSON.stringify({ places }, null, 2) + "\n");
  console.log(`Saved ${places.length} places to public/places.json`);

  const untagged = places.filter(p => !p.type).map(p => p.name);
  const noArea = [...new Set(places.filter(p => !p.area).map(p => p.outcode))];
  if (untagged.length) console.log(`\nNot in scripts/place-tags.json yet:\n  ${untagged.join("\n  ")}`);
  if (noArea.length) console.log(`\nPostcode districts without an area name in AREAS: ${noArea.join(", ")}`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
