    let estadoMaterias = {}; // Objeto para almacenar el estado actual de cada materia

    document.addEventListener('DOMContentLoaded', () => {
        inicializarMalla();
    });

    function inicializarMalla() {
        // Inicializar el estado de todas las materias
        materiasData.forEach(materia => {
            estadoMaterias[materia.id] = 'no_cursable'; // Por defecto, no cursable
        });

        // Las materias sin prerrequisitos son cursables desde el inicio
        materiasData.forEach(materia => {
            if (!correlatividadesData[materia.id] || correlatividadesData[materia.id].length === 0) {
                estadoMaterias[materia.id] = 'cursable';
            }
        });

        renderizarMalla();
        actualizarVistaMalla();
    }

    function renderizarMalla() {
        const mallaContainer = document.getElementById('malla-container');
        mallaContainer.innerHTML = ''; // Limpiar el contenedor

        // Agrupar materias por año y semestre
        const mallaAgrupada = {};
        materiasData.forEach(materia => {
            if (!mallaAgrupada[materia.año]) {
                mallaAgrupada[materia.año] = {};
            }
            if (!mallaAgrupada[materia.año][materia.semestre]) {
                mallaAgrupada[materia.año][materia.semestre] = [];
            }
            mallaAgrupada[materia.año][materia.semestre].push(materia);
        });

        // Ordenar años y semestres
        const añosOrdenados = Object.keys(mallaAgrupada).sort((a, b) => parseInt(a) - parseInt(b));

        añosOrdenados.forEach(año => {
            const añoBloque = document.createElement('div');
            añoBloque.classList.add('año-bloque');
            añoBloque.innerHTML = `<h2>Año ${año}</h2>`;
            mallaContainer.appendChild(añoBloque);

            const semestresOrdenados = Object.keys(mallaAgrupada[año]).sort((a, b) => parseInt(a) - parseInt(b));

            semestresOrdenados.forEach(semestre => {
                const semestreBloque = document.createElement('div');
                semestreBloque.classList.add('semestre-bloque');
                semestreBloque.innerHTML = `<h3>Semestre ${semestre}</h3>`;
                añoBloque.appendChild(semestreBloque);

                const materiasGrid = document.createElement('div');
                materiasGrid.classList.add('materias-grid');
                semestreBloque.appendChild(materiasGrid);

                mallaAgrupada[año][semestre].forEach(materia => {
                    const materiaDiv = document.createElement('div');
                    materiaDiv.classList.add('materia');
                    materiaDiv.id = materia.id;
                    materiaDiv.textContent = materia.nombre;
                    materiaDiv.addEventListener('click', () => actualizarEstadoMateria(materia.id));
                    materiasGrid.appendChild(materiaDiv);
                });
            });
        });
    }

    function actualizarEstadoMateria(materiaId) {
        const materiaActual = estadoMaterias[materiaId];
        let materiasHabilitadasRecientemente = []; // Para resaltar las nuevas habilitaciones

        if (materiaActual === 'cursable') {
            estadoMaterias[materiaId] = 'aprobada';
        } else if (materiaActual === 'aprobada') {
            // Si se desaprueba, se vuelve cursable si cumple, o no_cursable si no
            estadoMaterias[materiaId] = verificarPrerrequisitos(materiaId) ? 'cursable' : 'no_cursable';
        } else {
            // Si es no_cursable, no se puede hacer clic para aprobar
            alert('No puedes aprobar esta materia. Primero debes aprobar sus correlativas.');
            return;
        }

        // Recalcular estados de todas las materias
        const estadosPrevios = { ...estadoMaterias }; // Copia del estado antes del recálculo

        materiasData.forEach(materia => {
            if (estadoMaterias[materia.id] !== 'aprobada') { // No recalcular si ya está aprobada
                const esCursable = verificarPrerrequisitos(materia.id);
                estadoMaterias[materia.id] = esCursable ? 'cursable' : 'no_cursable';

                // Detectar materias que pasaron de no_cursable a cursable
                if (estadosPrevios[materia.id] === 'no_cursable' && estadoMaterias[materia.id] === 'cursable') {
                    materiasHabilitadasRecientemente.push(materia.id);
                }
            }
        });

        actualizarVistaMalla(materiasHabilitadasRecientemente);
    }

    function verificarPrerrequisitos(materiaId) {
        const prerrequisitos = correlatividadesData[materiaId];

        if (!prerrequisitos || prerrequisitos.length === 0) {
            return true; // No tiene prerrequisitos, siempre es cursable
        }

        // Manejo de casos especiales de "14 unidades curriculares"
        let cumple14Unidades = true;
        if (prerrequisitos.includes("14_unidades_curriculares_aprobadas")) {
            const materiasAprobadasCount = Object.values(estadoMaterias).filter(estado => estado === 'aprobada').length;
            if (materiasAprobadasCount < 14) {
                cumple14Unidades = false;
            }
        }

        if (!cumple14Unidades) {
            return false;
        }

        // Verificar prerrequisitos normales (excluyendo el especial si existe)
        const prerrequisitosNormales = prerrequisitos.filter(p => p !== "14_unidades_curriculares_aprobadas");
        return prerrequisitosNormales.every(prereqId => estadoMaterias[prereqId] === 'aprobada');
    }

    function actualizarVistaMalla(materiasHabilitadasRecientemente = []) {
        materiasData.forEach(materia => {
            const materiaDiv = document.getElementById(materia.id);
            if (materiaDiv) {
                // Limpiar clases de estado anteriores
                materiaDiv.classList.remove('aprobada', 'cursable', 'no_cursable', 'habilitada-por-aprobacion');

                // Aplicar nueva clase de estado
                materiaDiv.classList.add(estadoMaterias[materia.id]);

                // Aplicar clase de resaltado si fue habilitada recientemente
                if (materiasHabilitadasRecientemente.includes(materia.id)) {
                    materiaDiv.classList.add('habilitada-por-aprobacion');
                }
            }
        });
    }
    
