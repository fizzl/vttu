/** Page copy and data, kept out of the layout so App stays an assembly sheet. */

export type Principle = { title: string; body: string };

export const principles: Principle[] = [
  {
    title: "Työ jokaiselle",
    body: "Unionin tehtävänä on osoittaa jokaiselle työllistetylle tehtävä, johon hänellä on osaamista tai jonka omaksumiseen hän on valmis. Työsuhde ja palkanmaksu alkavat viivytyksettä, jotta siirtymä työelämään ei jäisi byrokratian varaan.",
  },
  {
    title: "Valtiorahoitteinen alku",
    body: "Toiminta rahoitetaan alkuvaiheessa valtion varoin työllistettyjen lukumäärän mukaan. Tavoitteena on rakentaa organisaatio, joka kykenee ajan myötä kantamaan yhä suuremman osan ohjauksestaan omalla henkilöstöllään.",
  },
  {
    title: "Tuttu organisaatio",
    body: "Organisaatio rakentuu suuren monialayrityksen tavoin: alakohtaiset johtajat, myynti, projektipäälliköt, tiimit ja toteuttava porras muodostavat selkeän toimintaketjun. Kaikki toimijat ovat unionin omia työntekijöitä.",
  },
  {
    title: "Yksilön vapaus",
    body: "Unioni ei edellytä jäseniltään pysyvää sitoutumista. Sen tarkoitus on mahdollistaa oppiminen, työnteko ja yksilön kehitys niin, että työntekijä voi jatkaa eteenpäin heti, kun omat tavoitteet sitä puoltavat.",
  },
];

export type Fact = [label: string, value: string];

export const facts: Fact[] = [
  ["Peruspalkka", "1 000 €/kk + seutukohtainen elinkustannuskorotus"],
  ["Vertailu", "30 % enemmän kuin nykyiset työttömyysetuudet"],
  ["Palkanmaksu", "Alkaa heti työsuhteen alkaessa"],
  ["Pätevyysvaatimus", "Pätevä tai halukas oppimaan"],
  ["Toimipisteet", "Logistisesti järkevät paikat, myös pienemmät kaupungit"],
];

export type PayRow = [seutu: string, perus: string, korotus: string, yhteensa: string];

export const payRows: PayRow[] = [
  ["Pääkaupunkiseutu", "1 000 €", "+ 210 €", "1 210 €"],
  ["Kaupunki", "1 000 €", "+ 60 €", "1 060 €"],
  ["Taajama", "1 000 €", "+ 30 €", "1 030 €"],
  ["Haja-asutusalue", "1 000 €", "+ 10 €", "1 010 €"],
];
