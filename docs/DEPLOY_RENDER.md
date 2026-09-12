# Giocare online con GitHub e Render

Questo progetto richiede **un Web Service Node.js**, con il sito e il server di gioco sullo stesso indirizzo HTTPS. È già incluso [`render.yaml`](../render.yaml), configurato per un solo processo e una sola istanza. Non serve un database per le prove attuali, né un sistema di registrazione con password.

## Accesso dei giocatori

Ogni giocatore apre il link, sceglie un nickname e crea o raggiunge una stanza. Il server assegna un cookie casuale `HttpOnly`, `SameSite=Strict` e `Secure` in produzione. Il nickname è un nome visualizzato: non è una credenziale. Per invitare soltanto gli amici creare una stanza privata e condividere il codice, che consente l'ingresso a chi lo conosce.

Il rientro mantiene il posto finché la sessione e la stanza sono ancora presenti sul server e si usa lo stesso browser con lo stesso cookie. Cancellare i cookie, cambiare browser o lasciar scadere la sessione significa diventare un nuovo giocatore. Due schede con lo stesso cookie rappresentano la stessa persona; per provare due giocatori sullo stesso PC usare profili browser separati o una finestra privata.

## Pubblicazione su GitHub

1. Nel proprio client Git inizializzare il repository dentro questa cartella, se non è già presente. Includere `src/`, `tests/`, `docs/`, `package.json`, `package-lock.json`, le configurazioni, `.node-version` e `render.yaml`, quindi controllare e salvare il primo commit.
2. Pubblicare il repository su GitHub. Con GitHub Desktop, aggiungere il repository locale da **File → Add local repository** e usare **Publish repository**. Se il repository remoto esiste già, collegarlo come destinazione nel proprio client Git ed eseguire il push.
3. Il repository può essere **privato**: collegare l'account GitHub a Render e concedergli accesso a questo repository.

Il `.gitignore` esclude dipendenze, build, cache, risultati delle prove, file `.env` e chiavi locali. La cartella `esempi di carte/` resta sul PC come archivio delle fonti; le immagini necessarie al sito sono già in `src/client/public/cards/` e **vanno pubblicate insieme al codice**. Le fonti dell'autore conservate in `docs/sources/` restano incluse per le verifiche dei dati. L'esclusione Git non cancella nessun file locale e non rimuove file eventualmente già registrati in un repository preesistente.

La scelta della visibilità GitHub riguarda il codice e i materiali inclusi; il link del gioco su Render resta raggiungibile dai giocatori. [Collegare GitHub a Render](https://render.com/docs/git-provider).

## Creazione su Render

1. In Render scegliere **New → Blueprint**, collegare il repository e usare `render.yaml` dalla cartella principale. La configurazione propone il piano Free e la regione Frankfurt.
2. Controllare i parametri proposti e creare il servizio. Render installa le dipendenze necessarie alla compilazione, prepara client e server, poi avvia il server compilato.
3. Quando il servizio è attivo, aprire l'indirizzo `https://nome-assegnato.onrender.com`. Il server ricava l'origine consentita da `RENDER_EXTERNAL_URL`, fornita da Render; non inserire un indirizzo di esempio.
4. Aprire `/api/health` sullo stesso indirizzo: deve restituire `status: "ok"`. Poi eseguire la prova multiplayer indicata sotto.

I campi del Blueprint e la gestione delle variabili seguono la [specifica Render](https://render.com/docs/blueprint-spec) e le [variabili predefinite](https://render.com/docs/environment-variables).

Se si preferisce **New → Web Service**, inserire manualmente:

| Impostazione | Valore |
| --- | --- |
| Runtime | Node |
| Root Directory | Vuota, se il progetto è nella radice del repository |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `node dist/runtime/src/server/index.js` |
| Health Check Path | `/api/health` |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | `10000` |
| Instances | `1`, senza autoscaling |
| Auto-Deploy | Off |

Il file `.node-version` seleziona la serie Node 22, coerente con il Dockerfile. La compilazione include esplicitamente le dipendenze di sviluppo perché TypeScript e Vite servono durante la build. L'avvio usa direttamente il risultato compilato. [Versione Node su Render](https://render.com/docs/node-version).

Render termina HTTPS e inoltra HTTP e WebSocket alla stessa porta del servizio; il client usa automaticamente `wss://` sull'indirizzo HTTPS della pagina. Non occorre esporre porte aggiuntive o distribuire il client separatamente. [Web Services](https://render.com/docs/web-services), [WebSocket su Render](https://render.com/docs/websocket).

Per un dominio personalizzato configurare `PUBLIC_ORIGIN=https://gioco.example.com` con il dominio reale e condividere quel solo indirizzo. La variabile prevale sull'indirizzo `onrender.com`; non aggiungere percorsi, query o credenziali. Le variabili si impostano nel pannello Render: `.env.example` è un promemoria e il server non carica automaticamente un file `.env`.

## Limiti durante le partite

- **Stanze, sessioni e partite sono in memoria.** Un riavvio, un nuovo deploy o la sostituzione dell'istanza le elimina. Non è presente il recupero delle partite dopo un riavvio.
- **Una sola istanza e un solo processo Node.** Non avviare cluster o repliche: i processi avrebbero stanze e cookie di sessione indipendenti. Su più istanze Render può assegnare una nuova connessione WebSocket a un'istanza diversa. [Connessioni e riconnessioni](https://render.com/docs/websocket).
- **Il piano Free si sospende dopo 15 minuti senza traffico in ingresso**, compresi HTTP e messaggi WebSocket. L'apertura successiva può richiedere circa un minuto per risvegliare il servizio. Il piano a pagamento elimina questa sospensione per inattività, ma non salva le partite dai riavvii. [Limiti del piano Free](https://render.com/docs/free).
- **Gli aggiornamenti sono manuali.** Dopo un push su GitHub, usare in Render **Manual Deploy → Deploy latest commit** quando non ci sono partite in corso. `autoDeployTrigger: "off"` evita che ogni push avvii un deploy. Anche la manutenzione della piattaforma può sostituire l'istanza. [Deploy Render](https://render.com/docs/deploys).

Questa configurazione è adatta a prove coordinate online. Restano i limiti dell'alpha descritti nel [README](../README.md): le carte attive sono fixture tecniche e il regolamento ufficiale completo non è implementato.

## Prova da fare sul link pubblico

Usare due dispositivi o due browser indipendenti, possibilmente su reti diverse:

1. Creare una stanza privata dal primo browser e unirsi dal secondo usando il codice.
2. Dare nomi distinguibili ai giocatori, selezionare Pronto e avviare.
3. Verificare che ogni giocatore controlli soltanto il proprio posto e veda soltanto la propria mano.
4. Eseguire mosse da entrambi i dispositivi e controllare l'aggiornamento del tavolo.
5. Aggiornare una pagina: deve rientrare lo stesso giocatore, senza creare un posto nuovo.
6. Interrompere temporaneamente una connessione: il tavolo deve segnalare la pausa; ripristinare la rete e verificare il rientro.
7. Con un terzo browser provare un codice sbagliato: l'accesso deve essere rifiutato. Un codice corretto resta un invito valido nei limiti dei posti e della fase della stanza.

La preparazione dei file e le verifiche locali non sostituiscono questa prova: un deploy effettivo verifica anche dominio, cookie HTTPS e proxy WebSocket. Non è stato pubblicato un servizio Render nell'ambito della preparazione locale.
