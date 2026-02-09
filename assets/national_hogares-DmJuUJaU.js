const hogares_total = 3338256;
const poblacion_en_hogares = 10688936;
const personas_por_hogar = 3.2;
const tamano_hogar = {
	total_hogares: 3338256,
	distribucion: [
		{
			tamano: "1",
			hogares: 391169,
			porcentaje: 11.72
		},
		{
			tamano: "2",
			hogares: 613935,
			porcentaje: 18.39
		},
		{
			tamano: "3",
			hogares: 703402,
			porcentaje: 21.07
		},
		{
			tamano: "4",
			hogares: 654799,
			porcentaje: 19.61
		},
		{
			tamano: "5",
			hogares: 460021,
			porcentaje: 13.78
		},
		{
			tamano: "6",
			hogares: 265765,
			porcentaje: 7.96
		},
		{
			tamano: "7+",
			hogares: 250165,
			porcentaje: 7.49
		}
	]
};
const national_hogares = {
	hogares_total: hogares_total,
	poblacion_en_hogares: poblacion_en_hogares,
	personas_por_hogar: personas_por_hogar,
	tamano_hogar: tamano_hogar
};

export { national_hogares as default, hogares_total, personas_por_hogar, poblacion_en_hogares, tamano_hogar };
