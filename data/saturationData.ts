import type { SaturationData } from '../types';

export const saturationData: SaturationData = {
    'tipos': [
        { 'id': 'tape', 'tipo': 'Cinta (Tape) 📼', 'color': '5-7 🟡', 'tipoColor': 'Calidez, compresión suave, redondeo de transientes', 'rasgos': 'Sutil, cohesivo, "pegamento", suaviza agudos ásperos', 'ejemplos': 'UAD Studer A800, Waves Kramer Tape, Slate Digital VTM', 'aplicaciones': 'Buses de mezcla, master, guitarras acústicas, voces', 'ventajas': 'Añade cohesión y calidez de forma muy musical.', 'limitaciones': 'Puede reducir el "punch" si se abusa de ella.' },
        { 'id': 'tube', 'tipo': 'Válvula (Tube) 🔥', 'color': '6-8 🟠', 'tipoColor': 'Rico en armónicos pares, sonido grande y tridimensional', 'rasgos': 'Redondo, cálido, musical, engorda el sonido', 'ejemplos': 'Soundtoys Decapitator (T-Type), Black Box HG-2, Arturia TUBE-STA', 'aplicaciones': 'Voces, bajos, pianos, buses de instrumentos', 'ventajas': 'Excelente para añadir peso y riqueza armónica.', 'limitaciones': 'Puede ser demasiado "lento" para material muy percusivo.' },
        { 'id': 'transistor', 'tipo': 'Transistor (Solid State) ⚡', 'color': '7-9 🔴', 'tipoColor': 'Agresivo, rico en armónicos impares, con "mordida"', 'rasgos': 'Presente, con "punch", afilado, a veces áspero', 'ejemplos': 'Soundtoys Decapitator (E-Type), FabFilter Saturn 2 (Clean Tube)', 'aplicaciones': 'Baterías, guitarras eléctricas, sintes agresivos, voces de rock', 'ventajas': 'Añade presencia y agresividad sin subir el volumen.', 'limitaciones': 'Fácil de exagerar y puede sonar estridente.' },
        { 'id': 'overdrive', 'tipo': 'Overdrive 🎸', 'color': '8-10 🔴', 'tipoColor': 'Distorsión suave a media, simula amplificadores', 'rasgos': 'Cálido, dinámico, responde al nivel de entrada', 'ejemplos': 'iZotope Trash 2, Guitar Rig, Kuassa Amplifikation', 'aplicaciones': 'Guitarras, bajos, teclados (Rhodes, Wurlitzer), voces con efecto', 'ventajas': 'Muy expresivo y musical, ideal para añadir carácter.', 'limitaciones': 'Puede tener un color muy específico y no ser versátil.' },
        { 'id': 'fuzz', 'tipo': 'Fuzz 👹', 'color': '9-10 🔴', 'tipoColor': 'Distorsión extrema, cuadrada y comprimida', 'rasgos': 'Extremo, caótico, sustain largo, sonido "roto"', 'ejemplos': 'Soundtoys Devil-Loc, UAD Raw Distortion, varios pedales de guitarra', 'aplicaciones': 'Guitarras solistas (estilo Hendrix), bajos para rock pesado, diseño sonoro', 'ventajas': 'Sonido icónico y potente para ciertos estilos.', 'limitaciones': 'Destruye la dinámica y el timbre original por completo.' },
        { 'id': 'bitcrusher', 'tipo': 'Digital (Bitcrusher) 👾', 'color': 'Variable 🤖', 'tipoColor': 'Lo-Fi, robótico, aliasing digital', 'rasgos': 'Frío, digital, ruidoso, degrada la señal', 'ejemplos': 'D16 Decimort 2, TAL-Bitcrusher (Gratuito), stock plugins de DAWs', 'aplicaciones': 'Baterías electrónicas, sintes, voces (efecto Glitch/teléfono)', 'ventajas': 'Perfecto para crear texturas Lo-Fi y efectos digitales.', 'limitaciones': 'No es musical en el sentido tradicional, es un efecto especial.' }
    ],
    'instrumentos': [
        { 'instrumento': 'Voz Principal 🎤', 'opcion1': 'Válvula 🔥', 'opcion2': 'Cinta 📼', 'opcion3': 'Transistor ⚡', 'notas': 'Válvula para calidez y tamaño. Cinta para suavizar y cohesionar. Transistor para rock/rap agresivo.' },
        { 'instrumento': 'Bus de Batería 🥁', 'opcion1': 'Transistor ⚡', 'opcion2': 'Cinta 📼', 'opcion3': 'Overdrive 🎸', 'notas': 'Transistor para "punch". Cinta para "pegamento" y control de platillos. Overdrive paralelo para destrucción.' },
        { 'instrumento': 'Bajo Eléctrico/Sintético 🎸', 'opcion1': 'Válvula 🔥', 'opcion2': 'Overdrive 🎸', 'opcion3': 'Fuzz 👹', 'notas': 'Válvula para engordar. Overdrive para que se escuche en altavoces pequeños. Fuzz para rock/metal.' },
        { 'instrumento': 'Guitarras Eléctricas 🎸', 'opcion1': 'Overdrive 🎸', 'opcion2': 'Transistor ⚡', 'opcion3': 'Fuzz 👹', 'notas': 'La base del sonido de guitarra. Overdrive para ritmo, Transistor para solos afilados, Fuzz para caos.' },
        { 'instrumento': 'Guitarras Acústicas 🎻', 'opcion1': 'Cinta 📼', 'opcion2': 'Válvula 🔥', 'opcion3': 'N/A', 'notas': 'Saturación muy sutil. Cinta para controlar picos de púa y añadir calidez. Válvula para dar cuerpo.' },
        { 'instrumento': 'Piano / Teclados 🎹', 'opcion1': 'Válvula 🔥', 'opcion2': 'Cinta 📼', 'opcion3': 'Overdrive 🎸', 'notas': 'Válvula para pianos y Rhodes. Cinta para Wurlitzers. Overdrive para órganos Hammond.' },
        { 'instrumento': 'Sintetizadores 🎹', 'opcion1': 'Transistor ⚡', 'opcion2': 'Bitcrusher 👾', 'opcion3': 'Cinta 📼', 'notas': 'Depende del sonido. Transistor para leads agresivos, Bitcrusher para texturas Lo-Fi, Cinta para pads suaves.' },
        { 'instrumento': 'Master Bus 🎚️', 'opcion1': 'Cinta 📼', 'opcion2': 'Válvula 🔥', 'opcion3': 'N/A', 'notas': 'Usar con extrema sutileza (1-5% de mezcla). Cinta para cohesión, Válvula para añadir riqueza armónica general.' }
    ],
    'generos': [
        { 'genero': 'Rock/Metal 🤘', 'saturadores': 'Transistor ⚡, Overdrive 🎸, Fuzz 👹', 'enfoque': 'Agresividad, "mordida", presencia en los medios.' },
        { 'genero': 'Pop 🎤', 'saturadores': 'Válvula 🔥, Cinta 📼', 'enfoque': 'Calidez, tamaño, control sutil de la dinámica.' },
        { 'genero': 'Jazz 🎷', 'saturadores': 'Cinta 📼, Válvula 🔥', 'enfoque': 'Calidez analógica, suavidad, cohesión.' },
        { 'genero': 'Electronic/EDM 🎹', 'saturadores': 'Transistor ⚡, Bitcrusher 👾, Cinta 📼', 'enfoque': 'Punch, texturas digitales, control de picos.' },
        { 'genero': 'Lo-Fi/Hip-Hop 📻', 'saturadores': 'Cinta 📼, Bitcrusher 👾, Válvula 🔥', 'enfoque': 'Carácter vintage, degradación de la señal, calidez.' }
    ],
    'lista': [
        { 'tipo': 'Multibanda/Versátil', 'nombre': 'FabFilter Saturn 2', 'notasSonido': 'El rey de la versatilidad. Puede hacer de todo, desde cinta sutil a distorsión extrema, por bandas de frecuencia.' },
        { 'tipo': 'Multibanda/Versátil', 'nombre': 'Soundtoys Decapitator', 'notasSonido': 'Un estándar de la industria. 5 modos que cubren Válvula, Transistor y Cinta. Sonido increíble y fácil de usar.' },
        { 'tipo': 'Multibanda/Versátil', 'nombre': 'iZotope Trash 2', 'notasSonido': 'Ideal para distorsión creativa y diseño sonoro. Múltiples etapas de distorsión y convolución.' },
        { 'tipo': 'Cinta 📼', 'nombre': 'Slate Digital VTM', 'notasSonido': 'Emulación muy respetada de dos máquinas de cinta clásicas. Excelente para buses y master.' },
        { 'tipo': 'Cinta 📼', 'nombre': 'Waves Kramer Master Tape', 'notasSonido': 'Sonido con mucho carácter, ideal para un toque vintage instantáneo.' },
        { 'tipo': 'Cinta 📼', 'nombre': 'Softube Tape', 'notasSonido': 'Fácil de usar y con un sonido muy musical. Tres modelos de máquina en uno.' },
        { 'tipo': 'Válvula 🔥', 'nombre': 'Black Box Analog Design HG-2MS', 'notasSonido': 'Plugin de alta gama para buses y mastering. Añade riqueza y tamaño como pocos.' },
        { 'tipo': 'Válvula 🔥', 'nombre': 'Klanghelm SDRR', 'notasSonido': 'Increíblemente asequible y versátil. 4 modos: Tube, Digi, Fuzz, Desk.' },
        { 'tipo': 'Válvula 🔥', 'nombre': 'Radiator (Soundtoys)', 'notasSonido': 'Basado en el preamplificador Altec 1567A. Sonido grueso y con mucho color.' },
        { 'tipo': 'Digital 👾', 'nombre': 'D16 Group Decimort 2', 'notasSonido': 'El estándar para degradación de audio de alta calidad (Bitcrusher, Sampler).' },
        { 'tipo': 'Gratuito/Excelente', 'nombre': 'Softube Saturation Knob', 'notasSonido': 'Gratuito, un solo potenciómetro y tres modos. Simple y efectivo.' },
        { 'tipo': 'Gratuito/Excelente', 'nombre': 'Klanghelm IVGI', 'notasSonido': 'Saturación y distorsión muy versátil y con un sonido de alta calidad. Gratuito.' }
    ]
};

export const saturationTooltips: { [key: string]: string } = {
    'Armónicos': 'Frecuencias adicionales que se generan por encima de la nota fundamental. La saturación las añade, enriqueciendo el sonido. Los armónicos pares (Válvula) suelen sonar más musicales y cálidos, mientras que los impares (Transistor) suenan más agresivos.',
    'Transientes': 'Los picos iniciales y rápidos de un sonido (ej. el golpe de una batería). La saturación de cinta es famosa por redondearlos y suavizarlos, actuando como un compresor natural.',
    'Clipping': 'Una forma de distorsión que ocurre cuando la señal de audio supera el nivel máximo que un sistema puede manejar. Puede ser "suave" (soft clipping) para añadir calidez o "duro" (hard clipping) para agresividad.',
    'Cohesión': 'También llamado "pegamento" (glue). Es la cualidad que hace que diferentes instrumentos suenen como si pertenecieran a la misma grabación. La saturación de cinta en un bus es una técnica clásica para lograrlo.'
};