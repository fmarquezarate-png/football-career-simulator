/**
 * Nacionalidades soportadas para crear jugador + name pools.
 * Códigos ISO / flagcdn.
 */
export interface Nationality {
  id: string;
  name: string;
  code: string;
  firstNames: string[];
  lastNames: string[];
}

export const NATIONALITIES: Nationality[] = [
  {
    id: "esp", name: "España", code: "es",
    firstNames: ["Álvaro", "Carlos", "Diego", "Fernando", "Iker", "Javier", "Marcos", "Pablo", "Sergio", "Xavi", "Jordi", "Rodri", "Ferran", "Nico", "Pedri", "Gavi", "Ansu"],
    lastNames: ["García", "Martínez", "López", "Rodríguez", "Fernández", "González", "Sánchez", "Ruiz", "Torres", "Ramos", "Vázquez", "Iglesias", "Serrano", "Molina", "Reyes"],
  },
  {
    id: "arg", name: "Argentina", code: "ar",
    firstNames: ["Lionel", "Ángel", "Rodrigo", "Julián", "Enzo", "Alejandro", "Nicolás", "Mateo", "Emiliano", "Franco", "Cristian", "Gonzalo", "Lautaro", "Facundo", "Thiago"],
    lastNames: ["Álvarez", "Fernández", "Martínez", "González", "Di María", "Otamendi", "Paredes", "Correa", "Mac Allister", "Tagliafico", "De Paul", "Romero", "Molina", "Palacios", "Lo Celso"],
  },
  {
    id: "bra", name: "Brasil", code: "br",
    firstNames: ["Vinícius", "Rodrygo", "Neymar", "Gabriel", "Bruno", "Ricardo", "Luiz", "Eduardo", "Casemiro", "Antony", "Raphinha", "Endrick", "Marquinhos", "Danilo", "Alisson"],
    lastNames: ["Silva", "Santos", "Ferreira", "Oliveira", "Junior", "Souza", "Almeida", "Rodrigues", "Guimarães", "Jesus", "Paquetá", "Pereira", "Costa", "Barbosa", "Ribeiro"],
  },
  {
    id: "fra", name: "Francia", code: "fr",
    firstNames: ["Kylian", "Antoine", "Aurélien", "Ousmane", "Théo", "Randal", "Marcus", "Benjamin", "Ibrahima", "Jules", "William", "Bradley", "Warren", "Michael", "Adrien"],
    lastNames: ["Mbappé", "Griezmann", "Tchouaméni", "Dembélé", "Hernández", "Kolo Muani", "Thuram", "Pavard", "Konaté", "Koundé", "Saliba", "Barcola", "Zaïre-Emery", "Olise", "Rabiot"],
  },
  {
    id: "eng", name: "Inglaterra", code: "gb-eng",
    firstNames: ["Harry", "Jude", "Phil", "Bukayo", "Jack", "Marcus", "Declan", "Cole", "Trent", "Kyle", "John", "Ben", "Kobbie", "Anthony", "Ollie", "Levi"],
    lastNames: ["Kane", "Bellingham", "Foden", "Saka", "Grealish", "Rashford", "Rice", "Palmer", "Alexander-Arnold", "Walker", "Stones", "Chilwell", "Mainoo", "Gordon", "Watkins", "Colwill"],
  },
  {
    id: "ger", name: "Alemania", code: "de",
    firstNames: ["Kai", "Jamal", "Florian", "Joshua", "Leroy", "Serge", "Ilkay", "Antonio", "Nico", "Pascal", "Robert", "Waldemar", "Marc-André", "Manuel", "Julian"],
    lastNames: ["Havertz", "Musiala", "Wirtz", "Kimmich", "Sané", "Gnabry", "Gündogan", "Rüdiger", "Schlotterbeck", "Groß", "Andrich", "Anton", "ter Stegen", "Neuer", "Brandt"],
  },
  {
    id: "por", name: "Portugal", code: "pt",
    firstNames: ["Cristiano", "Bruno", "Bernardo", "Rafael", "João", "Diogo", "Rúben", "Nuno", "Vitinha", "Nélson", "Gonçalo", "Otávio", "Pepe", "Danilo", "Rodrigo"],
    lastNames: ["Ronaldo", "Fernandes", "Silva", "Leão", "Cancelo", "Jota", "Dias", "Mendes", "Ramos", "Semedo", "Neves", "Guedes", "Palhinha", "Pereira", "Bentancur"],
  },
  {
    id: "ita", name: "Italia", code: "it",
    firstNames: ["Federico", "Nicolò", "Sandro", "Alessandro", "Gianluca", "Lorenzo", "Matteo", "Davide", "Riccardo", "Bryan", "Mateo", "Giacomo", "Andrea", "Marco", "Giorgio"],
    lastNames: ["Chiesa", "Barella", "Tonali", "Bastoni", "Scamacca", "Pellegrini", "Politano", "Frattesi", "Calafiori", "Cristante", "Retegui", "Raspadori", "Bonucci", "Verratti", "Chiellini"],
  },
  {
    id: "ned", name: "Países Bajos", code: "nl",
    firstNames: ["Virgil", "Frenkie", "Memphis", "Cody", "Xavi", "Nathan", "Tijjani", "Denzel", "Matthijs", "Jurriën", "Steven", "Wout", "Donyell", "Justin", "Ryan"],
    lastNames: ["van Dijk", "de Jong", "Depay", "Gakpo", "Simons", "Aké", "Reijnders", "Dumfries", "de Ligt", "Timber", "Bergwijn", "Weghorst", "Malen", "Kluivert", "Gravenberch"],
  },
  {
    id: "col", name: "Colombia", code: "co",
    firstNames: ["Luis", "James", "Juan", "Jhon", "Daniel", "Rafael", "Davinson", "Yerry", "Wilmar", "Camilo", "Mateus", "Jefferson", "Miguel", "Jorge", "Jaminton"],
    lastNames: ["Díaz", "Rodríguez", "Cuadrado", "Córdoba", "Muñoz", "Santos Borré", "Sánchez", "Mina", "Barrios", "Vargas", "Uribe", "Lerma", "Ángel Borja", "Carrascal", "Mosquera"],
  },
  {
    id: "uru", name: "Uruguay", code: "uy",
    firstNames: ["Federico", "Darwin", "Luis", "Rodrigo", "José", "Facundo", "Manuel", "Sebastián", "Nahitan", "Ronald", "Maximiliano", "Nicolás", "Matías", "Giorgian", "Agustín"],
    lastNames: ["Valverde", "Núñez", "Suárez", "Bentancur", "Giménez", "Pellistri", "Ugarte", "Coates", "Nández", "Araújo", "Gómez", "de la Cruz", "Vecino", "De Arrascaeta", "Canobbio"],
  },
  {
    id: "mar", name: "Marruecos", code: "ma",
    firstNames: ["Hakim", "Achraf", "Sofyan", "Yassine", "Youssef", "Azzedine", "Bilal", "Nayef", "Romain", "Amine", "Anass", "Ilias", "Selim", "Abdelhamid", "Noussair"],
    lastNames: ["Ziyech", "Hakimi", "Amrabat", "Bounou", "En-Nesyri", "Ounahi", "El Khannouss", "Aguerd", "Saïss", "Harit", "Zaroury", "Chair", "Amallah", "Sabiri", "Mazraoui"],
  },
];

export function findNationality(id: string): Nationality {
  return NATIONALITIES.find(n => n.id === id) ?? NATIONALITIES[0];
}
