import { ApplicationForm } from "./components/ApplicationForm";
import { FactList } from "./components/FactList";
import { InfoBox } from "./components/InfoBox";
import { PayTable } from "./components/PayTable";
import { PrincipleGrid } from "./components/PrincipleGrid";
import { Section } from "./components/Section";
import { Wordmark } from "./components/Wordmark";

export default function App() {
  return (
    <div className="mx-auto my-0 max-w-3xl border-x border-b border-white-300 bg-white-100 sm:my-8">
      {/* Header: the VTTU wordmark and the official name */}
      <header className="border-t border-white-300 px-6 py-10 sm:px-10">
        <Wordmark spark className="text-[2.441rem] leading-none" />
        <p className="mt-2 text-[1.25rem] font-semibold text-ink-700">
          Valtion Työ- ja Tuotantounioni
        </p>
      </header>

      {/* Info box: the flagship yellow field, with its entry shimmer */}
      <InfoBox />

      {/* Esittely */}
      <Section eyebrow="Avoin työ- ja oppimismalli" title="Töihin jo tänään!" accent={0} surface>
        <p className="max-w-prose leading-relaxed text-ink-900">
          Kuka tahansa voi hakeutua unionin palvelukseen elämäntilanteestaan riippumatta. Ajatus on
          yksinkertainen: jokaiselle osoitetaan työtä osaamisen, potentiaalin ja kiinnostuksen
          perusteella, samalla kun oppiminen ja eteneminen tehdään mahdolliseksi ilman tarpeetonta
          viivettä. Unioni vahvistaa työllisyyttä, toimintakykyä ja koko maan tasapainoista
          kehitystä.
        </p>
      </Section>

      {/* Hakemus: the inert form, moved up right after the intro */}
      <Section eyebrow="Hakemus" title="Hae VTTU töihin!" accent={1}>
        <p className="mb-5 max-w-prose text-ink-900">
          Täytä alla olevat kentät. Riittää kun jätät sähköpostiosoitteesi ja kerrot omin sanoin,
          mikä sinua motivoi.
        </p>
        <ApplicationForm />
      </Section>

      {/* Miten VTTU toimii: cards sharing 1px seams */}
      <Section eyebrow="Toimintaperiaate" title="Miten VTTU toimii" accent={2} surface>
        <PrincipleGrid />
      </Section>

      {/* Lyhyesti: key/value facts */}
      <Section eyebrow="Perustiedot" title="Lyhyesti" accent={3}>
        <FactList />
      </Section>

      {/* Palkkamalli: the table */}
      <Section
        eyebrow="Kannustinmalli"
        title="Palkka ja elinkustannusindeksi"
        accent={0}
        surface
      >
        <PayTable />
        <p className="mt-4 max-w-prose text-[0.9rem] leading-relaxed text-ink-500">
          Korotus noudattaa vähenevän hyödyn periaatetta. Malli huomioi elinkustannusten alueelliset
          erot, kannustaa väljempään asumiseen ja avaa pienemmillekin kaupungeille realistisen kasvun
          mahdollisuuden.
        </p>
      </Section>

      {/* Projektit: prose + badges */}
      <Section eyebrow="Työn luonne" title="Kaikki työ on projektilähtöistä" accent={1}>
        <div className="max-w-prose space-y-3 leading-relaxed text-ink-900">
          <p>
            Jos työn luonne ei valmiiksi ole projektilähtöinen, se voidaan jäsentää esimerkiksi
            vuoden mittaisiksi kokonaisuuksiksi, joita johdetaan, hinnoitellaan ja arvioidaan
            projektityön logiikalla.
          </p>
          <p>
            Jos projekti tuottaa voittoa, siitä ohjataan <strong className="font-semibold">20 %</strong>{" "}
            unionin tulevaisuusrahastoon oman toiminnan jatkuvuuden turvaamiseksi. Loppu jaetaan tasan
            projektin jäsenten kesken.
          </p>
          <p>
            Jos projekti ei tuota voittoa, unioni kattaa ylijäämäkulut rahastostaan. Erillisiä
            tulospalkkioita ei makseta, mutta peruspalkanmaksu jatkuu keskeytyksettä. Tämä tekee
            riskistä hallittavan ja kannustaa yrittämään kunnianhimoisesti.
          </p>
        </div>
      </Section>

      {/* Toiminta-ajatus: the mission statement */}
      <Section eyebrow="Toiminta-ajatus" title="Työtä koko Suomelle" accent={2} surface>
        <div className="max-w-prose space-y-3 leading-relaxed text-ink-900">
          <p>
            Valtion Työ- ja Tuotantounioni perustuu ajatukseen, että jokaisella on oikeus
            mielekkääseen työhön elämäntilanteestaan riippumatta. Unioni vastaanottaa hakijan,
            osoittaa hänelle tehtävän ja käynnistää palkanmaksun viivytyksettä. Lähtökohta on
            käytännöllinen: työkyky, oppiminen ja toimeentulo kannattaa sitoa toisiinsa mahdollisimman
            nopeasti ja selkeästi.
          </p>
          <p>
            Toiminta tukee koko maan tasapainoista kehitystä. Toimipisteet sijoitetaan logistisesti
            tarkoituksenmukaisiin paikkoihin siten, että myös pienemmillä paikkakunnilla on
            mahdollisuus kasvaa, vahvistua ja rakentaa kestävää paikallista elinvoimaa.
          </p>
          <p>
            Unioni ei kilpaile työntekijöistä muun työelämän kanssa, vaan toimii sen täydentäjänä.
            Tavoitteena on osaamisen karttuminen, työn arvostus ja yksilön mahdollisuus edetä omaan
            tahtiinsa. Paras lopputulos on, että järjestelmä tekee itsensä tarpeettomammaksi
            synnyttämällä uutta osaamista, liikkuvuutta ja aloitekykyä.
          </p>
        </div>
      </Section>

      {/* Usein kysyttyä */}
      <Section
        eyebrow="Usein kysyttyä"
        title="Entä jos projekti tuottaa jäsenilleen poikkeuksellisen paljon arvoa?"
        accent={3}
      >
        <div className="max-w-prose space-y-3 leading-relaxed text-ink-900">
          <p>
            Toisinaan projekti voi onnistua niin hyvin, että sen tekijöille kertyy merkittävä
            varallisuus lyhyessä ajassa. Onko tämä järjestelmän valuvirhe, vai pikemminkin osoitus
            siitä, että malli kykenee synnyttämään todellista arvoa?
          </p>
          <p>
            Ehkä he perustavat oppimillaan tiedoilla uuden yrityksen, siirtyvät muualle työelämään tai
            käynnistävät jotakin täysin omaa.{" "}
            <strong className="font-semibold">Juuri siinä ajatus kirkastuu.</strong> Unioni ei
            edellytä lojaalisuutta, vaan mahdollistaa oppimisen, työnteon ja yksilön itsenäisyyden.
            Dynaaminen yhteiskunta hyötyy siitä, että ihmiset nousevat liikkeelle.
          </p>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-white-300 bg-white-100 px-6 py-8 sm:px-10">
        <div className="flex items-center gap-3">
          <Wordmark className="text-[1.25rem]" />
          <span className="text-[0.8rem] font-semibold tracking-[0.04em] text-ink-700">
            x Maxpower, &copy; 2026
          </span>
        </div>
        <p className="mt-3 text-[0.8rem] text-ink-500">Tämä sivu on satiiria ja höpöhöpöä.</p>
      </footer>
    </div>
  );
}
