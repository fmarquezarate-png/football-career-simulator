/**
 * Pools de nombres para generar jugadores.
 *
 * Dos niveles:
 *  1. `COUNTRY_POOLS` — pools específicos para las grandes potencias futbolísticas.
 *  2. `REGION_POOLS` — fallback por región lingüística, usado por el resto de países.
 *
 * `countries.ts` asigna a cada país una `NameRegion`, así que cualquiera de los
 * 205 países tiene siempre un pool coherente sin mantener 205 listas.
 */

export type NameRegion =
  | "hispano" | "lusofono" | "anglo" | "frances" | "germano" | "neerlandes"
  | "nordico" | "italiano" | "eslavo" | "heleno" | "rumano" | "hungaro"
  | "baltico" | "arabe" | "hebreo" | "turco" | "persa" | "caucaso"
  | "africano" | "indio" | "asiaOriental" | "sudesteAsiatico" | "pacifico";

export interface NamePool {
  firstNames: string[];
  lastNames: string[];
}

export const REGION_POOLS: Record<NameRegion, NamePool> = {
  hispano: {
    firstNames: ["Álvaro", "Carlos", "Diego", "Fernando", "Javier", "Marcos", "Pablo", "Sergio", "Nicolás", "Mateo", "Santiago", "Andrés", "Gonzalo", "Emiliano", "Rodrigo", "Iván", "Lucas", "Bruno"],
    lastNames: ["García", "Martínez", "López", "Rodríguez", "Fernández", "González", "Sánchez", "Ruiz", "Torres", "Ramos", "Vázquez", "Molina", "Herrera", "Castillo", "Navarro", "Peña", "Ortega", "Cabrera"],
  },
  lusofono: {
    firstNames: ["Vinícius", "Rodrygo", "Gabriel", "Bruno", "Ricardo", "Eduardo", "Matheus", "Lucas", "João", "Diogo", "Rúben", "Gonçalo", "Tiago", "André", "Rafael", "Danilo", "Éder", "Vitor"],
    lastNames: ["Silva", "Santos", "Ferreira", "Oliveira", "Souza", "Almeida", "Rodrigues", "Pereira", "Costa", "Barbosa", "Ribeiro", "Carvalho", "Gomes", "Fonseca", "Moreira", "Teixeira", "Cardoso", "Neves"],
  },
  anglo: {
    firstNames: ["Harry", "Jude", "Jack", "Marcus", "Declan", "Cole", "Kyle", "John", "Ben", "Anthony", "Ollie", "Levi", "Ryan", "Connor", "Ethan", "Mason", "Tyler", "Reece"],
    lastNames: ["Kane", "Bellingham", "Grealish", "Rice", "Palmer", "Walker", "Stones", "Gordon", "Watkins", "Bailey", "Thompson", "Harrison", "Clarke", "Bennett", "Foster", "Doyle", "Murphy", "Kelly"],
  },
  frances: {
    firstNames: ["Kylian", "Antoine", "Aurélien", "Ousmane", "Théo", "Randal", "Marcus", "Ibrahima", "Jules", "William", "Bradley", "Warren", "Adrien", "Lucas", "Enzo", "Nordi", "Youssouf", "Loïc"],
    lastNames: ["Mbappé", "Griezmann", "Tchouaméni", "Dembélé", "Hernández", "Thuram", "Konaté", "Koundé", "Saliba", "Barcola", "Olise", "Rabiot", "Diarra", "Camara", "Traoré", "Doumbia", "Fofana", "Cissé"],
  },
  germano: {
    firstNames: ["Kai", "Jamal", "Florian", "Joshua", "Leroy", "Serge", "Nico", "Pascal", "Robert", "Julian", "Maximilian", "Felix", "Lukas", "Jonas", "Tim", "Leon", "David", "Elias"],
    lastNames: ["Havertz", "Musiala", "Wirtz", "Kimmich", "Sané", "Gnabry", "Rüdiger", "Schlotterbeck", "Andrich", "Anton", "Brandt", "Müller", "Weber", "Schneider", "Hofmann", "Baumgartner", "Wagner", "Fischer"],
  },
  neerlandes: {
    firstNames: ["Virgil", "Frenkie", "Memphis", "Cody", "Xavi", "Nathan", "Tijjani", "Denzel", "Matthijs", "Jurriën", "Steven", "Wout", "Donyell", "Justin", "Ryan", "Sven", "Micky", "Quinten"],
    lastNames: ["van Dijk", "de Jong", "Depay", "Gakpo", "Simons", "Aké", "Reijnders", "Dumfries", "de Ligt", "Timber", "Bergwijn", "Weghorst", "Malen", "Kluivert", "Gravenberch", "van de Ven", "Veerman", "Bakker"],
  },
  nordico: {
    firstNames: ["Erling", "Martin", "Alexander", "Viktor", "Emil", "Rasmus", "Christian", "Pierre-Emil", "Mikkel", "Jesper", "Kristoffer", "Anton", "Oscar", "Elias", "Lucas", "Isak", "Joakim", "Sander"],
    lastNames: ["Haaland", "Ødegaard", "Isak", "Gyökeres", "Forsberg", "Højlund", "Eriksen", "Højbjerg", "Damsgaard", "Lindström", "Ajer", "Berg", "Nilsson", "Andersson", "Larsen", "Olsen", "Hansen", "Karlsson"],
  },
  italiano: {
    firstNames: ["Federico", "Nicolò", "Sandro", "Alessandro", "Gianluca", "Lorenzo", "Matteo", "Davide", "Riccardo", "Giacomo", "Andrea", "Marco", "Luca", "Simone", "Giovanni", "Stefano", "Emanuele", "Tommaso"],
    lastNames: ["Chiesa", "Barella", "Tonali", "Bastoni", "Scamacca", "Pellegrini", "Politano", "Frattesi", "Calafiori", "Cristante", "Retegui", "Raspadori", "Rossi", "Ferrari", "Esposito", "Conti", "Ricci", "Greco"],
  },
  eslavo: {
    firstNames: ["Luka", "Robert", "Aleksandar", "Nikola", "Ivan", "Dušan", "Marko", "Filip", "Piotr", "Jakub", "Tomáš", "Milan", "Andrij", "Oleksandr", "Vladimir", "Stefan", "Josip", "Mateo"],
    lastNames: ["Modrić", "Lewandowski", "Mitrović", "Vlahović", "Perišić", "Kovačević", "Novák", "Zieliński", "Szczęsny", "Souček", "Schick", "Ilić", "Yaremchuk", "Zinchenko", "Petrović", "Jovanović", "Marković", "Horvat"],
  },
  heleno: {
    firstNames: ["Giorgos", "Kostas", "Dimitris", "Vangelis", "Anastasios", "Petros", "Nikos", "Christos", "Armando", "Rey", "Elseid", "Sokol", "Andi", "Milot", "Vedat", "Ilias", "Stavros", "Panagiotis"],
    lastNames: ["Giakoumakis", "Mavropanos", "Bakasetas", "Pavlidis", "Tsimikas", "Masouras", "Broja", "Asllani", "Hysaj", "Rashica", "Muriqi", "Berisha", "Papadopoulos", "Konstantinou", "Ioannou", "Karagiannis", "Vlachos", "Nikolaou"],
  },
  rumano: {
    firstNames: ["Ianis", "Dennis", "Nicolae", "Radu", "Andrei", "Valentin", "Florinel", "Răzvan", "Alexandru", "Vlad", "Marius", "Cristian", "Mihai", "Bogdan", "Ion", "Sergiu", "Adrian", "Ștefan"],
    lastNames: ["Hagi", "Man", "Stanciu", "Drăgușin", "Rațiu", "Mihăilă", "Coman", "Marin", "Popescu", "Ionescu", "Dumitru", "Radu", "Nistor", "Chiricheș", "Moldovan", "Pop", "Georgescu", "Munteanu"],
  },
  hungaro: {
    firstNames: ["Dominik", "Roland", "Barnabás", "Milos", "Attila", "Zsolt", "Willi", "Ádám", "Péter", "Bálint", "Gergő", "Márton", "Dániel", "András", "Tamás", "Krisztián", "László", "Ákos"],
    lastNames: ["Szoboszlai", "Sallai", "Varga", "Kerkez", "Fiola", "Nagy", "Orbán", "Szalai", "Gulácsi", "Kovács", "Tóth", "Horváth", "Bolla", "Schäfer", "Molnár", "Németh", "Farkas", "Balogh"],
  },
  baltico: {
    firstNames: ["Ragnar", "Karol", "Rokas", "Konstantin", "Sergei", "Mattias", "Henri", "Vladislavs", "Roberts", "Jānis", "Edgaras", "Arvydas", "Martin", "Joonas", "Kristian", "Deniss", "Tomas", "Gintaras"],
    lastNames: ["Klavan", "Sinkevičius", "Slivka", "Vassiljev", "Zenjov", "Käit", "Anier", "Gutkovskis", "Uldriķis", "Ikaunieks", "Jankauskas", "Petrauskas", "Tamm", "Saar", "Ozols", "Bērziņš", "Kazlauskas", "Urbonas"],
  },
  arabe: {
    firstNames: ["Hakim", "Achraf", "Sofyan", "Yassine", "Youssef", "Bilal", "Nayef", "Amine", "Anass", "Ilias", "Selim", "Noussair", "Mohamed", "Omar", "Karim", "Riyad", "Ismaël", "Walid"],
    lastNames: ["Ziyech", "Hakimi", "Amrabat", "Bounou", "En-Nesyri", "Aguerd", "Saïss", "Harit", "Chair", "Mazraoui", "Salah", "Elneny", "Trezeguet", "Mahrez", "Bennacer", "Bounedjah", "Al-Dawsari", "Khalil"],
  },
  hebreo: {
    firstNames: ["Manor", "Eran", "Oscar", "Dor", "Liel", "Mohammad", "Eli", "Yarden", "Idan", "Gavriel", "Sagiv", "Tai", "Omri", "Neta", "Ilay", "Roi", "Doron", "Ofir"],
    lastNames: ["Solomon", "Zahavi", "Gloukh", "Peretz", "Abada", "Turgeman", "Dasa", "Shua", "Nachmias", "Cohen", "Levi", "Biton", "Yeini", "Jaber", "Feingold", "Elkayam", "Menachem", "Davidzada"],
  },
  turco: {
    firstNames: ["Arda", "Kenan", "Hakan", "Cengiz", "Merih", "Ferdi", "Orkun", "Kerem", "Yusuf", "Barış", "Emre", "Zeki", "Rüstü", "Eldor", "Nurali", "Ruslan", "Bahodir", "Timur"],
    lastNames: ["Güler", "Yıldız", "Çalhanoğlu", "Ünder", "Demiral", "Kadıoğlu", "Kökçü", "Aktürkoğlu", "Yazıcı", "Alper", "Şahin", "Çelik", "Shomurodov", "Alibekov", "Zhukov", "Karimov", "Nazarov", "Bekbolat"],
  },
  persa: {
    firstNames: ["Mehdi", "Sardar", "Alireza", "Saman", "Ehsan", "Karim", "Milad", "Ramin", "Omid", "Hossein", "Amir", "Farshid", "Ali", "Reza", "Kaveh", "Shoja", "Vahid", "Saeid"],
    lastNames: ["Taremi", "Azmoun", "Jahanbakhsh", "Ghoddos", "Hajsafi", "Ansarifard", "Mohammadi", "Rezaeian", "Noorollahi", "Kanaanizadegan", "Hosseini", "Ghafouri", "Torabi", "Amiri", "Karimi", "Sadeghi", "Nazari", "Ebrahimi"],
  },
  caucaso: {
    firstNames: ["Khvicha", "Giorgi", "Guram", "Otar", "Budu", "Zuriko", "Saba", "Luka", "Henrikh", "Eduard", "Sargis", "Tigran", "Nair", "Varazdat", "Levon", "Norberto", "Arman", "Vahan"],
    lastNames: ["Kvaratskhelia", "Chakvetadze", "Kashia", "Kiteishvili", "Zivzivadze", "Davitashvili", "Lobzhanidze", "Mkhitaryan", "Spertsyan", "Barseghyan", "Hovhannisyan", "Grigoryan", "Sarkisyan", "Petrosyan", "Mikaelyan", "Beglaryan", "Haroyan", "Ghazaryan"],
  },
  africano: {
    firstNames: ["Victor", "Ademola", "Alex", "Samuel", "Kelechi", "Wilfred", "Mohammed", "Thomas", "Jordan", "Michael", "Percy", "Themba", "Lyle", "Michael", "Sadio", "Emmanuel", "Daniel", "Joseph"],
    lastNames: ["Osimhen", "Lookman", "Iwobi", "Chukwueze", "Iheanacho", "Ndidi", "Kudus", "Partey", "Ayew", "Olise", "Tau", "Zwane", "Foster", "Olunga", "Mbeumo", "Bassey", "Adjei", "Mensah"],
  },
  indio: {
    firstNames: ["Sunil", "Sandesh", "Anirudh", "Gurpreet", "Rahul", "Manvir", "Sahal", "Lallianzuala", "Ashique", "Brandon", "Jamal", "Rakib", "Hasan", "Dinesh", "Kusal", "Bimal", "Anmol", "Rohit"],
    lastNames: ["Chhetri", "Jhingan", "Thapa", "Sandhu", "Bheke", "Singh", "Samad", "Chhangte", "Kuruniyan", "Fernandes", "Bhuyan", "Hossain", "Rahman", "Perera", "Silva", "Gurung", "Sharma", "Kumar"],
  },
  asiaOriental: {
    firstNames: ["Heung-min", "Kang-in", "Min-jae", "Jae-sung", "Ui-jo", "Takefusa", "Kaoru", "Daichi", "Ritsu", "Wataru", "Ao", "Takumi", "Wu", "Wei", "Hao", "Yuki", "Junya", "Hidemasa"],
    lastNames: ["Son", "Lee", "Kim", "Hwang", "Park", "Kubo", "Mitoma", "Kamada", "Doan", "Endo", "Tanaka", "Minamino", "Lei", "Shixin", "Junmin", "Ito", "Morita", "Nakamura"],
  },
  sudesteAsiatico: {
    firstNames: ["Chanathip", "Teerasil", "Supachok", "Theerathon", "Witan", "Marselino", "Egy", "Asnawi", "Rizky", "Faisal", "Safawi", "Syafiq", "Nguyễn", "Quang", "Công", "Neil", "Patrick", "Kevin"],
    lastNames: ["Songkrasin", "Dangda", "Sarachat", "Bunmathan", "Sulaeman", "Ferdinan", "Maulana", "Bahar", "Ridho", "Halim", "Rasid", "Ahmad", "Hải", "Phượng", "Vinh", "Etheridge", "Reichelt", "Diaz"],
  },
  pacifico: {
    firstNames: ["Roy", "Tommy", "Bill", "Sarpreet", "Marco", "Roi", "Clayton", "Alex", "Kosta", "Jackson", "Riley", "Cameron", "Setareki", "Roy", "Micah", "Justin", "Ben", "Nikko"],
    lastNames: ["Krishna", "Smith", "Tuiloma", "Singh", "Rojas", "Krishna", "Lewis", "Paulsen", "Barbarouses", "Irvine", "McGree", "Burgess", "Hughes", "Kaltack", "Lea'alafa", "Gaspar", "Waine", "Verbeek"],
  },
};

/** Overrides país a país para las grandes potencias futbolísticas. */
export const COUNTRY_POOLS: Record<string, NamePool> = {
  es: {
    firstNames: ["Álvaro", "Carlos", "Diego", "Fernando", "Iker", "Javier", "Marcos", "Pablo", "Sergio", "Xavi", "Jordi", "Rodri", "Ferran", "Nico", "Pedri", "Gavi", "Ansu"],
    lastNames: ["García", "Martínez", "López", "Rodríguez", "Fernández", "González", "Sánchez", "Ruiz", "Torres", "Ramos", "Vázquez", "Iglesias", "Serrano", "Molina", "Reyes"],
  },
  ar: {
    firstNames: ["Lionel", "Ángel", "Rodrigo", "Julián", "Enzo", "Alejandro", "Nicolás", "Mateo", "Emiliano", "Franco", "Cristian", "Gonzalo", "Lautaro", "Facundo", "Thiago"],
    lastNames: ["Álvarez", "Fernández", "Martínez", "González", "Di María", "Otamendi", "Paredes", "Correa", "Mac Allister", "Tagliafico", "De Paul", "Romero", "Molina", "Palacios", "Lo Celso"],
  },
  br: {
    firstNames: ["Vinícius", "Rodrygo", "Neymar", "Gabriel", "Bruno", "Ricardo", "Luiz", "Eduardo", "Casemiro", "Antony", "Raphinha", "Endrick", "Marquinhos", "Danilo", "Alisson"],
    lastNames: ["Silva", "Santos", "Ferreira", "Oliveira", "Junior", "Souza", "Almeida", "Rodrigues", "Guimarães", "Jesus", "Paquetá", "Pereira", "Costa", "Barbosa", "Ribeiro"],
  },
  fr: {
    firstNames: ["Kylian", "Antoine", "Aurélien", "Ousmane", "Théo", "Randal", "Marcus", "Benjamin", "Ibrahima", "Jules", "William", "Bradley", "Warren", "Michael", "Adrien"],
    lastNames: ["Mbappé", "Griezmann", "Tchouaméni", "Dembélé", "Hernández", "Kolo Muani", "Thuram", "Pavard", "Konaté", "Koundé", "Saliba", "Barcola", "Zaïre-Emery", "Olise", "Rabiot"],
  },
  "gb-eng": {
    firstNames: ["Harry", "Jude", "Phil", "Bukayo", "Jack", "Marcus", "Declan", "Cole", "Trent", "Kyle", "John", "Ben", "Kobbie", "Anthony", "Ollie", "Levi"],
    lastNames: ["Kane", "Bellingham", "Foden", "Saka", "Grealish", "Rashford", "Rice", "Palmer", "Alexander-Arnold", "Walker", "Stones", "Chilwell", "Mainoo", "Gordon", "Watkins", "Colwill"],
  },
  de: {
    firstNames: ["Kai", "Jamal", "Florian", "Joshua", "Leroy", "Serge", "Ilkay", "Antonio", "Nico", "Pascal", "Robert", "Waldemar", "Marc-André", "Manuel", "Julian"],
    lastNames: ["Havertz", "Musiala", "Wirtz", "Kimmich", "Sané", "Gnabry", "Gündogan", "Rüdiger", "Schlotterbeck", "Groß", "Andrich", "Anton", "ter Stegen", "Neuer", "Brandt"],
  },
  pt: {
    firstNames: ["Cristiano", "Bruno", "Bernardo", "Rafael", "João", "Diogo", "Rúben", "Nuno", "Vitinha", "Nélson", "Gonçalo", "Otávio", "Pepe", "Danilo", "Rodrigo"],
    lastNames: ["Ronaldo", "Fernandes", "Silva", "Leão", "Cancelo", "Jota", "Dias", "Mendes", "Ramos", "Semedo", "Neves", "Guedes", "Palhinha", "Pereira", "Bentancur"],
  },
  it: {
    firstNames: ["Federico", "Nicolò", "Sandro", "Alessandro", "Gianluca", "Lorenzo", "Matteo", "Davide", "Riccardo", "Bryan", "Mateo", "Giacomo", "Andrea", "Marco", "Giorgio"],
    lastNames: ["Chiesa", "Barella", "Tonali", "Bastoni", "Scamacca", "Pellegrini", "Politano", "Frattesi", "Calafiori", "Cristante", "Retegui", "Raspadori", "Bonucci", "Verratti", "Chiellini"],
  },
  nl: {
    firstNames: ["Virgil", "Frenkie", "Memphis", "Cody", "Xavi", "Nathan", "Tijjani", "Denzel", "Matthijs", "Jurriën", "Steven", "Wout", "Donyell", "Justin", "Ryan"],
    lastNames: ["van Dijk", "de Jong", "Depay", "Gakpo", "Simons", "Aké", "Reijnders", "Dumfries", "de Ligt", "Timber", "Bergwijn", "Weghorst", "Malen", "Kluivert", "Gravenberch"],
  },
  co: {
    firstNames: ["Luis", "James", "Juan", "Jhon", "Daniel", "Rafael", "Davinson", "Yerry", "Wilmar", "Camilo", "Mateus", "Jefferson", "Miguel", "Jorge", "Jaminton"],
    lastNames: ["Díaz", "Rodríguez", "Cuadrado", "Córdoba", "Muñoz", "Santos Borré", "Sánchez", "Mina", "Barrios", "Vargas", "Uribe", "Lerma", "Ángel Borja", "Carrascal", "Mosquera"],
  },
  uy: {
    firstNames: ["Federico", "Darwin", "Luis", "Rodrigo", "José", "Facundo", "Manuel", "Sebastián", "Nahitan", "Ronald", "Maximiliano", "Nicolás", "Matías", "Giorgian", "Agustín"],
    lastNames: ["Valverde", "Núñez", "Suárez", "Bentancur", "Giménez", "Pellistri", "Ugarte", "Coates", "Nández", "Araújo", "Gómez", "de la Cruz", "Vecino", "De Arrascaeta", "Canobbio"],
  },
  ma: {
    firstNames: ["Hakim", "Achraf", "Sofyan", "Yassine", "Youssef", "Azzedine", "Bilal", "Nayef", "Romain", "Amine", "Anass", "Ilias", "Selim", "Abdelhamid", "Noussair"],
    lastNames: ["Ziyech", "Hakimi", "Amrabat", "Bounou", "En-Nesyri", "Ounahi", "El Khannouss", "Aguerd", "Saïss", "Harit", "Zaroury", "Chair", "Amallah", "Sabiri", "Mazraoui"],
  },
};
