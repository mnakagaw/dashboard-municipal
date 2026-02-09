const centros_total = 7911;
const niveles = {
	inicial_primario: {
		centros: 5091,
		matricula: 1308423
	},
	secundario: {
		centros: 1901,
		matricula: 768922
	},
	adultos: {
		centros: 919,
		matricula: 169915
	}
};
const national_educacion_oferta = {
	centros_total: centros_total,
	niveles: niveles
};

export { centros_total, national_educacion_oferta as default, niveles };
