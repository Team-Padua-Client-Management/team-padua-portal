export interface ProvinceData {
  province: string;
  cities: string[];
}

export const PHILIPPINE_LOCATIONS: ProvinceData[] = [
  {
    province: 'Bulacan',
    cities: [
      'Malolos', 'Marilao', 'Bocaue', 'Balagtas', 'Guiguinto', 'Plaridel', 
      'Pulilan', 'Baliuag', 'Meycauayan', 'San Jose del Monte', 'Santa Maria', 
      'Bustos', 'Angat', 'Norzagaray', 'Hagonoy', 'Calumpit', 'Paombong', 
      'Pandi', 'Obando', 'Bulakan', 'Doña Remedios Trinidad', 'San Rafael', 
      'San Miguel', 'San Ildefonso'
    ].sort()
  },
  {
    province: 'Metro Manila (NCR)',
    cities: [
      'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Manila',
      'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig',
      'Pateros', 'Quezon City', 'San Juan', 'Taguig', 'Valenzuela'
    ].sort()
  },
  {
    province: 'Pampanga',
    cities: [
      'Angeles', 'San Fernando', 'Mabalacat', 'Apalit', 'Arayat', 'Bacolor',
      'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Macabebe', 'Magalang',
      'Masantol', 'Mexico', 'Minalin', 'Porac', 'San Luis', 'San Simon',
      'Santa Ana', 'Santa Rita', 'Santo Tomas', 'Sasmuan'
    ].sort()
  },
  {
    province: 'Cavite',
    cities: [
      'Bacoor', 'Cavite City', 'Dasmariñas', 'General Trias', 'Imus', 
      'Tagaytay', 'Trece Martires', 'Alfonso', 'Amadeo', 'Carmona', 
      'Gen. Mariano Alvarez', 'Gen. Emilio Aguinaldo', 'Indang', 'Kawit', 
      'Magallanes', 'Maragondon', 'Mendez', 'Naic', 'Noveleta', 'Rosario', 
      'Silang', 'Tanza', 'Ternate'
    ].sort()
  },
  {
    province: 'Laguna',
    cities: [
      'Biñan', 'Cabuyao', 'Calamba', 'Santa Rosa',
      'Alaminos', 'Bay', 'Calauan', 'Cavinti', 'Famy', 'Kalayaan', 'Liliw',
      'Los Baños', 'Luisiana', 'Lumban', 'Mabitac', 'Magdalena', 'Majayjay',
      'Nagcarlan', 'Paete', 'Pagsanjan', 'Pakil', 'Pangil', 'Pila', 'Rizal',
      'San Pablo', 'San Pedro', 'Santa Cruz', 'Santa Maria', 'Siniloan', 'Victoria'
    ].sort()
  },
  {
    province: 'Rizal',
    cities: [
      'Antipolo', 'Angono', 'Baras', 'Binangonan', 'Cainta', 'Cardona',
      'Jalajala', 'Morong', 'Pililla', 'Rodriguez (Montalban)', 'San Mateo',
      'Tanay', 'Taytay', 'Teresa'
    ].sort()
  },
  {
    province: 'Batangas',
    cities: [
      'Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Agoncillo', 'Alitagtag',
      'Balayan', 'Balete', 'Bauan', 'Calaca', 'Calatagan', 'Cuenca', 'Ibaan',
      'Laurel', 'Lemery', 'Lian', 'Lobo', 'Mabini', 'Malvar', 'Mataasnakahoy',
      'Nasugbu', 'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis',
      'San Nicolas', 'San Pascual', 'Santa Teresita', 'Taal', 'Talisay', 'Taysan',
      'Tingloy', 'Tuy'
    ].sort()
  },
  {
    province: 'Nueva Ecija',
    cities: [
      'Cabanatuan', 'Gapan', 'Muñoz', 'Palayan', 'San Jose', 'Aliaga', 'Bongabon',
      'Cabiao', 'Carranglan', 'Cuyapo', 'Gabaldon', 'General Mamerto Natividad',
      'General Tinio', 'Guimba', 'Jaen', 'Laur', 'Licab', 'Llanera', 'Lupao',
      'Nampicuan', 'Pantabangan', 'Peñaranda', 'Quezon', 'Rizal', 'San Antonio',
      'San Isidro', 'San Leonardo', 'Santa Rosa', 'Santo Domingo', 'Talavera',
      'Talugtug', 'Zaragoza'
    ].sort()
  }
];
