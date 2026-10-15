import { Alert, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { XMLParser } from 'fast-xml-parser';
import { supabase } from './supabase';

const steder = [
  { navn: 'Bornholm', latitude: 55.15, longitude: 14.92 },
  { navn: 'Gribskov', latitude: 56.0, longitude: 12.33 },
  { navn: 'København', latitude: 55.68, longitude: 12.57 },
  { navn: 'Aarhus', latitude: 56.16, longitude: 10.2 },
  { navn: 'Odense', latitude: 55.4, longitude: 10.39 },
  { navn: 'Aalborg', latitude: 57.05, longitude: 9.92 },
  { navn: 'Esbjerg', latitude: 55.47, longitude: 8.45 },
  { navn: 'Randers', latitude: 56.46, longitude: 10.04 },
];

function findSteder(nyhed) {
  const tekst = `${nyhed.title ?? ''} ${nyhed.description ?? ''}`
    .toLocaleLowerCase('da-DK');

  const ord = tekst.match(/[a-zæøåé]+/g) ?? [];

  return steder.filter((sted) =>
    ord.includes(sted.navn.toLocaleLowerCase('da-DK'))
  );
}

export default function App() {
  const [nyhedsMarkers, setNyhedsMarkers] = useState([]);

  useEffect(() => {
    async function hentNyheder() {
      try {
        // Genbrug den eksisterende login-session.
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        let session = sessionData.session;

        // Opret en anonym bruger, hvis der ikke er en session.
        if (!session) {
          const { data, error } =
            await supabase.auth.signInAnonymously();

          if (error) {
            throw error;
          }

          session = data.session;
        }

        if (!session) {
          throw new Error('Kunne ikke oprette en login-session');
        }

        console.log(
          'Supabase-login virker. Bruger-id:',
          session.user.id
        );

        // Hent nyheder fra DR.
        const response = await fetch(
          'https://www.dr.dk/nyheder/service/feeds/indland'
        );

        if (!response.ok) {
          throw new Error(`DR svarede med status ${response.status}`);
        }

        const xml = await response.text();

        const parser = new XMLParser({
          ignoreAttributes: true,
          parseTagValue: false,
        });

        const data = parser.parse(xml);

        if (!data.rss?.channel) {
          throw new Error('Svaret fra DR er ikke et forventet RSS-feed');
        }

        const items = data.rss.channel.item ?? [];
        const nyheder = Array.isArray(items) ? items : [items];

        // Find stednavne, og lav nyhederne om til markører.
        const nyeMarkers = nyheder.flatMap((nyhed, index) => {
          const fundneSteder = findSteder(nyhed);

          return fundneSteder.map((sted) => ({
            id: `${nyhed.guid || nyhed.link || index}-${sted.navn}`,
            nyhed_id: nyhed.guid || nyhed.link,
            link: nyhed.link || '',
            titel: nyhed.title || 'Nyhed uden overskrift',
            sted: sted.navn,
            coordinate: {
              latitude: sted.latitude,
              longitude: sted.longitude,
            },
          }));
        });

        // Gem nyhederne uden at oprette dubletter ved genindlæsning.
        const markorerTilDatabase = nyeMarkers
          .filter((marker) => marker.nyhed_id)
          .map((marker) => ({
            user_id: session.user.id,
            nyhed_id: marker.nyhed_id,
            titel: marker.titel,
            link: marker.link,
            sted: marker.sted,
            latitude: marker.coordinate.latitude,
            longitude: marker.coordinate.longitude,
          }));

        const unikkeMarkorer = [...new Map(
          markorerTilDatabase.map((marker) => [
            JSON.stringify([marker.nyhed_id, marker.sted]), marker,
          ])
        ).values()];

        if (unikkeMarkorer.length > 0) {
          const { error: gemFejl } = await supabase
            .from('nyhedsmarkorer')
            .upsert(unikkeMarkorer, {
              onConflict: 'user_id,nyhed_id,sted',
            });

          if (gemFejl) throw gemFejl;
        }

        // Vis de markører, der faktisk er gemt i databasen.
        const { data: gemteMarkorer, error: hentFejl } = await supabase
          .from('nyhedsmarkorer')
          .select('*')
          .eq('user_id', session.user.id);

        if (hentFejl) throw hentFejl;

        setNyhedsMarkers(gemteMarkorer.map((marker) => ({
          id: marker.id,
          titel: marker.titel,
          sted: marker.sted,
          coordinate: {
            latitude: marker.latitude,
            longitude: marker.longitude,
          },
        })));

        console.log('Markører hentet fra Supabase:', gemteMarkorer.length);

        console.log('Antal nyheder:', nyheder.length);
        console.log('Antal nyhedsmarkører:', nyeMarkers.length);
      } catch (error) {
        console.error('Fejl ved login eller hentning:', error);

        Alert.alert(
          'Fejl',
          error.message || 'Kunne ikke logge ind eller hente nyheder.'
        );
      }
    }

    hentNyheder();
  }, []);

  const myRegion = {
    latitude: 56.1,
    longitude: 10.5,
    latitudeDelta: 4.5,
    longitudeDelta: 5,
  };

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={myRegion}
        style={styles.map}
      >
        {/* Markører fra DR's nyheder */}
        {nyhedsMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            pinColor="blue"
            title={marker.titel}
            description={`Omtalt sted: ${marker.sted} (omtrentlig placering)`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});