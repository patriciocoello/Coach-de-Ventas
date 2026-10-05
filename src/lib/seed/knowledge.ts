// Documentos iniciales de la base de conocimiento. Transcritos de
// "Pasos a seguir en una llamada – Mente Fría" y del catálogo MF-CAT 2026.
// Se editan después desde /admin/conocimiento.

export interface SeedDocument {
  title: string;
  category: string;
  content: string;
  priority: number;
  use_in_customer: boolean;
  use_in_evaluation: boolean;
}

export const SALES_MANUAL = `# Pasos a seguir en una llamada · Mente Fría

## Para qué llamadas es esta guía
Para toda llamada de tinas. Hoy vendemos tres opciones: MF ONE, MF Horizon con Motor Pro y MF Horizon con Motor Premium. Unos clientes llegan buscando la MF ONE y otros la Horizon. En la llamada se identifica cuál quiere, y el precio, la entrega y el cierre se basan en ese producto.

## Punto 1 · Función del vendedor durante la llamada
Su trabajo no es hablar todo el tiempo ni recitar el catálogo. Quien hace las preguntas dirige la llamada.

Su función es:
- Dirigir la conversación.
- Entender qué necesita el prospecto.
- Determinar si realmente puede ayudarlo.
- Recomendar el producto correcto.
- Resolver dudas sin inventar información.
- No comprometer nada que no esté autorizado.
- Conseguir una decisión o un siguiente paso concreto.

**Regla principal: primero preguntar, después recomendar y finalmente cerrar. Mínimo, hacer de 5 a 7 preguntas.**

La llamada, paso a paso:
A Preparación (antes de la llamada) · B Apertura y quién decide (empieza la llamada) · C Situación actual · D Entender el problema y profundizar · E Resultado deseado · F Calificación · G Presentación de la solución · H Confirmación · I Precio · J Manejo de objeciones · K Cierre · L WhatsApp de seguimiento (en 30 min).

## A · Preparación
Todo lo de esta letra se hace antes de la llamada. Muchas veces no sabemos casi nada del cliente; se revisa lo que haya:
- Nombre del prospecto.
- De dónde llegó.
- Producto que le interesa, sólo si ya lo dijo por mensaje. Si no lo dijo, no se menciona hasta el final de la C.
- Conversaciones anteriores.
- Tipo de cliente: residencial, gimnasio, hotel, spa, arquitecto, etc.
- Objetivo específico de la llamada.
- Disponibilidad real: qué hay en stock, qué va bajo pedido y con qué tiempo.

Las tres opciones:
| Producto | Precio + IVA | Entrega | Temperatura | Se guarda para cerrar |
|---|---|---|---|---|
| MF ONE | $169,000 | Según stock** | 1 a 40 °C | Envío, ProDeck e instalación* |
| Horizon + Motor Premium | $89,000 | 2–3 días hábiles tras el pago | 3 a 42 °C | Envío y 10% |
| Horizon + Motor Pro | $74,000 | 2–3 días hábiles tras el pago | Sólo enfría | Envío y 10% |

\\* Instalación en casa sólo en CDMX o a menos de 2 horas. ** La MF ONE a veces está en stock y a veces no; la fecha depende de cuándo nos lleguen. Se revisa antes de cada llamada. La Horizon siempre está disponible. A clientes comerciales no se les cotiza el Motor Pro.

## B · Apertura y quién decide
Aquí empieza la llamada. De la B en adelante, todo pasa durante la llamada con el cliente.
La apertura debe transmitir seguridad y establecer cómo se llevará la llamada.

Lo que dice el vendedor: "Hola, [nombre], ¿cómo estás? Soy [nombre] de Mente Fría. Antes de explicarte los productos, me gustaría entender exactamente qué estás buscando y recomendarte la mejor opción. ¿Te parece?"

Quién decide · dentro de los primeros tres minutos: "Además de ti, ¿hay alguien más involucrado en la decisión?"

**Si hay pareja, socio u otro decisor, cambia el resultado obligatorio de la llamada:** que esa persona esté en la siguiente. Antes de colgar se agenda esa llamada con fecha, hora y los dos presentes.

## C · Descubrimiento de la situación actual
**El objetivo:** que el cliente te diga, con sus propias palabras, por qué necesita el producto y cómo le va a mejorar su vida o su negocio. Si lo dice él, no se lo tienes que vender tú.

Preguntas para todos:
- "¿Qué fue lo que te llamó la atención de nuestros productos?"
- "¿Lo buscas para ti o para un negocio?"
- "¿Ya has utilizado cold plunge anteriormente?"
- "¿En dónde te gustaría instalarlo?"
- "¿Actualmente tienes alguna solución similar?"
- "¿También quieres que la tina caliente el agua?" (define el motor: el Pro sólo enfría; el Premium y la MF ONE calientan)

Si es para una persona:
- "¿Entrenas? ¿Qué haces?"
- "¿Cómo estás durmiendo?"
- "¿Hay algo de tu salud o de tu energía que quieras mejorar?"

Si es para un negocio:
- "¿Qué tipo de negocio es y a quién atiende?"
- "¿Qué te gustaría ofrecerles a tus clientes que hoy no tienes?"
- "¿Cómo te imaginas que esto le ayude al negocio?"

Son ejemplos. Cada cliente es diferente: saca preguntas personales dependiendo de la persona o del negocio.

La última pregunta: "¿Viste algún modelo en específico, la MF ONE o la Horizon? ¿Cuál te gustó?"
Aquí no se explica el producto ni se profundiza. Sólo se pregunta cuál vio y cuál le gustó. Ya que lo dijo, entonces sí se hacen preguntas sobre ese modelo.

## D · Entender el problema y profundizar
Aquí no hay preguntas fijas, porque cada cliente es diferente. Primero identifica qué tipo de cliente es y, con base en su problema, haz las preguntas para entenderlo. Por ejemplo:
- Una persona con un tema de salud.
- Una persona que entrena y quiere recuperarse mejor.
- Una persona que duerme mal, trae estrés o no tiene energía.
- Un hotel o spa que quiere darles un plus a sus huéspedes.
- Un gimnasio que quiere ofrecer un servicio nuevo.

**Cuando ya identificaste el problema, profundiza.** Con pocas preguntas, haz que el cliente te explique el tema a fondo. Él habla; tú escuchas y anotas lo que dice, casi textual.

Preguntas que sirven casi siempre:
- "¿Qué te hizo buscarlo justo ahora?"
- "¿Qué has intentado hasta ahora y cuánto llevas gastado?"
- "¿Cómo te afecta eso en tu día?" (persona) · "¿Cómo le afecta a tu negocio?" (negocio)
- "¿Qué cambiaría para ti si lo resuelves?"

No debe exagerar el problema ni incomodar. La intención es entender la prioridad real.

## E · Resultado deseado
Hasta aquí el vendedor ya entendió el problema. En esta parte cambia el enfoque: deja de hablar de lo que está mal y pone al prospecto a describir cómo se vería la solución.

Sirve para tres cosas:
- El prospecto te dice con sus propias palabras qué quiere. Eso es exactamente lo que le vas a recomendar en la G.
- Cuando recomiendes, vas a estar repitiéndole lo que él mismo dijo. Es mucho más difícil que discuta con sus propias palabras.
- Te enteras de cómo va a medir si fue buena compra, y con eso sabes qué tienes que dejar claro antes de cerrar.

Preguntas:
- "Con todo lo que me contaste, ¿cuál es la característica más importante que tiene que tener el equipo para que te funcione perfecto?"
- "¿Para cuándo te gustaría tenerlo instalado?"
- "¿Qué tendría que pasar para que en seis meses me digas que valió la pena?" (en muy pocos casos; si no se hace con cuidado, te puede jugar en contra)

Sobre la característica más importante: casi siempre es una medida, una temperatura, un tiempo de entrega o una restricción del espacio — y en cuanto el cliente la dice, el modelo prácticamente se escoge solo.

| Lo que contesta el cliente | Qué significa para el vendedor |
|---|---|
| "Que también caliente" | MF ONE (hasta 40 °C) u Horizon con Motor Premium (hasta 42 °C). El Motor Pro sólo enfría. |
| "La quiero ya" | Horizon: siempre disponible, le llega en 2 a 3 días hábiles después de su pago. La MF ONE depende del stock: si hay, sale pronto; si no, la fecha depende de cuándo nos llegue. |
| "Que la pueda mover" | Horizon: 15 kg vacía, portátil. |
| "Que sea rígida, no inflable" | MF ONE: acrílico y fibra de vidrio, chiller integrado, 195 cm de largo (la Horizon mide 160 cm). |
| "Que enfríe lo más rápido posible" | Entre las Horizon, el Motor Premium: 400 L en 4.5 h contra 6.6 h del Pro (ambiente de 28 °C). |
| "Que tenga ozono" | MF ONE u Horizon con Motor Premium. El Motor Pro no tiene ozono. |
| "Es para mi gimnasio o spa" | MF ONE u Horizon con Motor Premium. A clientes comerciales no se les cotiza el Motor Pro. |
| "Que no haya obra" | Las tres. La MF ONE no requiere obra ni plomería y la Horizon se instala en cinco minutos. |
| "Que quepa por la puerta del jardín" | Medir antes de cotizar. Define modelo y logística de entrega. |
| "Que no tenga que comprar hielo" | Cualquiera de las tres. Es el argumento central de la marca. |

El vendedor debe anotar las respuestas casi textuales. Las va a usar en la G.

## F · Calificación del prospecto
Antes de presentar, debe conocer:
- Espacio disponible.
- Ubicación.
- Instalación eléctrica y drenaje.
- Fecha requerida.
- Modelo por el que llegó, si llegó buscando uno en específico.
- Personas involucradas en la decisión (ya se preguntó en la B).
- Nivel de interés.

Si hay otro decisor: se confirma lo que se preguntó en la B: la siguiente llamada ya tiene nombre de la otra persona, fecha y hora.
La recomendación no se hace aquí. Aquí sólo se termina de reunir la información. El vendedor recomienda en la G.

## G · Presentación de la solución
No debe presentar todos los productos. Debe recomendar uno principal y, si tiene sentido, una alternativa.

Estructura: "Por lo que me comentas, buscas [necesidad], lo instalarías en [lugar] y para ti es especialmente importante [prioridad]. Por eso, la opción que más sentido tiene es [producto]."

Después debe mencionar las tres características más fuertes del producto que recomendó, escogidas según lo que ese cliente en particular necesita: "Yo personalmente te lo recomiendo por… (menciona las tres razones)".

No debe vaciar toda la ficha técnica sin contexto.

## H · Confirmación
Antes de mencionar precio hay que confirmar que la recomendación aterrizó. El vendedor escoge una de estas dos preguntas, según el caso:
- "¿Hasta aquí hace sentido todo?"
- "¿Hay algo importante que no hayamos considerado?"
Pregunta y se calla hasta que el cliente conteste. Esto permite detectar objeciones antes del cierre.

## I · Precio
Debe decir el precio claramente, sin disculparse, sin justificarlo y sin agregar nada más.
- MF ONE: "La inversión de la MF ONE es de $169,000."
- Horizon: "La inversión de la Horizon con Motor [Premium / Pro] es de $[89,000 / 74,000]."

**Después del precio, te quedas callado.** No hablas hasta que el otro hable, aunque se sientan varios segundos. El que habla primero pierde en la negociación.

Qué se guarda: al dar el precio no se menciona nada más. El envío, el ProDeck, la instalación y el descuento se guardan para la J, y sólo si el cliente duda mucho.

Nunca debe decir:
- "Está un poco caro."
- "Pero te puedo hacer descuento."
- "Pero te regalamos el envío y la instalación." (eso va después, si hace falta)
- "El precio es negociable."
- "Sé que es mucho dinero."
- "A lo mejor se sale de tu presupuesto."

## J · Manejo de objeciones
Ninguna objeción se responde en el primer intento. Primero se entiende, después se contesta. El reflejo del vendedor va a ser responder en cuanto la oiga — los pasos 1 al 4 existen justo para frenar eso.
1. Escuchar sin interrumpir.
2. Confirmar que entendió.
3. Hacer una pregunta. (Ej.: "¿Qué parte te gustaría evaluar: el producto, la inversión o el momento de compra?")
4. Identificar la objeción real.
5. Responder con información autorizada.
6. Volver a pedir la decisión.

Cómo se responde: cada cliente es diferente, así que a cada uno se le dice algo diferente. La respuesta se arma con lo que él mismo te contó en la C y la D: su negocio, su salud, su descanso, su entrenamiento. Dos ejemplos:
- Negocio al que le va mal y se quiere esperar: "Entiendo que te quieras esperar, pero por lo que me contaste, a tu negocio no le está yendo bien. Justo por eso: este producto te va a ayudar a impulsar tus ventas, te da otro modelo de negocio y te va a traer clientes que hoy no tienes. Además, te puedo ofrecer arrendamiento."
- Persona que duerme mal, sin energía, que no tiene prisa: "Entiendo. Me dijiste que duermes mal y que traes ansiedad. ¿Para qué esperar seis meses más durmiendo mal? Mejor la compras ahorita, duermes mejor y vives mejor esos seis meses."

Paso 6: volver a pedir la decisión. Cuando el cliente te dijo su objeción y ya se la respondiste, no te quedes callado esperando que él cierre. Tú cierras con esta pregunta: "Con eso resuelto, ¿avanzamos?"

### Si el cliente duda mucho (lo que se guardó en la I)
Sólo en casos en los que el cliente lo está dudando mucho. Se dice de forma personal, como alguien que quiere que el cliente tenga su tina. **Todo depende de que el pago quede esta semana. Si no queda esta semana, no se regala nada.**
- MF ONE: "Mira, adicionalmente, porque quiero que tu vida o tu negocio empiecen a mejorar y no quiero que te quedes sin tu tina: si queda tu pago esta semana, te incluyo el envío gratis, que tiene un costo de $6,000, y el ProDeck, que tiene un costo de $6,900. Te estás ahorrando $12,900 si queda esta semana."
- MF ONE · si vive en CDMX o a menos de 2 horas: "Y algo que nunca hacemos: vamos a tu casa y te la instalamos nosotros, para que no muevas un dedo."
- Horizon: "Mira, quiero que tengas tu tina y que de verdad veas lo increíble que es. Como quiero que te la quedes, te regalo el envío y además te hago un descuento que nunca hago: 10%. Pero tiene que quedar esta semana."

## K · Cierre
Toda llamada debe terminar con uno de estos tres resultados:
1. Pago o anticipo.
2. Siguiente paso con fecha y hora, con todos los que deciden.
3. Descartado.
Cualquier otra cosa es una llamada abierta y se cuenta como abierta.

**"Cotización enviada" e "información pendiente" no son cierres, son pendientes.** Sólo cuentan como cierre si salen de la llamada con fecha y hora de seguimiento ya acordadas. Si el vendedor manda la cotización y cuelga sin fecha, la llamada no se cerró.

Qué se pide: en la MF ONE, el anticipo de 40%. En la Horizon, el pago: siempre está disponible y le llega en 2 a 3 días hábiles después de su pago. Se puede pagar con transferencia, tarjeta, meses sin intereses, efectivo o depósito. Si el cliente pide factura, hasta entonces se le pasa la otra cuenta.

- Cierre MF ONE: "Perfecto, [nombre]. Para que ya tengas tu MF ONE, el anticipo es del 40%. Te paso los datos bancarios. Por favor avísame cuando quede el depósito, la transferencia o el pago."
- Cierre Horizon: "Perfecto, [nombre]. Te paso los datos bancarios y el link de pago, o como lo prefieras. Por favor avísame cuando quede el pago para mandarte tu tina."
- Si el cliente dice que ahorita no puede: "Va, te marco a las [12 / 1 / la hora que le quede] para que quede."
- Si hay otro decisor: "Te mando la cotización hoy. ¿Te marco el jueves a las 11 con [nombre] en la llamada para dejarlo confirmado?"

La fecha la propone el vendedor. Nunca pregunta "¿cuándo te marco?".

## L · WhatsApp de seguimiento
Dentro de los 30 minutos después de colgar. El mensaje depende de cómo terminó la llamada.

1 · El que va a pagar ya: "Muchas gracias por la llamada, [nombre]. Te comparto los datos bancarios y el link de pago, como te quede mejor. Avísame cuando quede el pago para que salga tu [producto]. Escogiste muy bien: [lo que eligió en la llamada y por qué]."

2 · Se envió cotización y hay fecha de seguimiento: "Hola, [nombre]. Gracias por tu tiempo. Te mando la cotización de la [producto]. Sobre lo que me comentaste de [objeción]: [respuesta en una o dos líneas]. Quedamos el [día] a las [hora] [con (el otro decisor)] para dejarlo confirmado. Te marco a esa hora."

3 · La llamada quedó abierta, sin fecha: esto nunca debería pasar: siempre tiene que haber una fecha. Si pasa, el mensaje responde la objeción y el vendedor propone la fecha. "Hola, [nombre]. Gracias por tu tiempo. Sobre lo que me comentaste de [objeción]: [respuesta en una o dos líneas]. Te propongo retomarlo el [día] a las [hora] [con (el otro decisor)] para resolver lo que te falte. ¿Te funciona?"

4 · Lost: un último mensaje de cierre, directo, con exactamente lo que el cliente dijo que necesita. Si es algo de salud, ahí se ataca. Ejemplo (salud): "Entiendo que el producto es una inversión cara y que a lo mejor no es para ti. Pero déjame preguntarte algo: ¿cuánto pagarías por mejorar tu salud? Piénsalo. Y te puedo ayudar con financiamiento."
`;

export const POLICIES = `# Políticas comerciales · Mente Fría (catálogo septiembre 2026)

- Precios y envío en MXN + IVA. El envío se cobra por unidad.
- Anticipos: tinas rígidas 40%; saunas 50%. Tinas portátiles (Horizon / Barrel): pago completo, llegan en 2–3 días hábiles.
- Formas de pago: transferencia, tarjeta, meses sin intereses, efectivo o depósito. Si el cliente pide factura, se le pasa la otra cuenta.
- Garantía de satisfacción de 30 días: si en los primeros 30 días no está satisfecho, se retira el equipo y se reembolsa el 100%.
- Garantía extendida: lleva cualquier tina o motor a 24 meses en total. No se descuenta y lleva IVA. Tinas fijas $13,000 por unidad; portátiles y motores sueltos 10% del precio de lista.
- A clientes comerciales (B2B: gimnasios, spas, hoteles, etc.) NO se les cotiza el Motor Pro.
- Los tiempos de entrega dependen del stock en CDMX al momento de la compra.
- Instalación de la MF ONE en casa sólo en CDMX o a menos de 2 horas (y sólo como concesión de cierre).
- La instalación de saunas la hace un técnico de Mente Fría y su costo depende de la ubicación.
- Concesiones autorizadas (sólo si el cliente duda mucho y el pago queda esta semana): MF ONE → envío gratis ($6,000) + ProDeck ($6,900); Horizon → envío gratis + 10% de descuento. No existen otras concesiones autorizadas; para Barrel, Steel, motores y saunas no hay descuentos documentados.
- Arrendamiento: mencionado en el manual como opción para negocios; los términos deben confirmarse con dirección antes de comprometerlos.
- El vendedor no debe inventar precios, características, tiempos ni descuentos. Si no sabe algo, lo confirma y da seguimiento con fecha.

Contacto: +52 56 1647 1386 · mentefria.com · ventas@mentefria.com
`;

export const INSTALLATION = `# Instalación y logística

- Tinas portátiles (Horizon, Barrel): se instalan en cinco minutos, sin hielo ni herramientas, en interior o exterior. Pesan 15 kg (Horizon) y 13 kg (Barrel) vacías.
- MF ONE y MF Steel Barrel: chiller integrado, sin obra ni plomería. MF ONE mide 195 × 80 × 71 cm: medir accesos (puertas, pasillos, jardín) antes de cotizar.
- MF Two y MF Steel Horizon: Motor Premium externo de 1 HP. El motor va en interior con ventilación al exterior, piso firme y nivelado, sin sol directo ni lluvia. Espacio libre: 100 cm arriba y frente al ventilador, 50 cm del serpentín, 20 cm a los lados. Circuito dedicado de 20 A con tierra.
- Alimentación eléctrica tinas: 110–127 V, 60 Hz. Saunas: 240 V (HUUM 001 20 A, 003 30 A, 005 50 A).
- Saunas: entrega en 12 semanas; instalación por técnico de Mente Fría con costo según ubicación. Medidas en ancho × fondo × alto.
- Envío: tinas rígidas $6,000; portátiles y motores Pro/Premium $1,500; Motor Comercial $4,000; saunas $12,000. Se cobra por unidad.
- Antes de cotizar conviene conocer: espacio disponible, ubicación, interior/exterior, instalación eléctrica y drenaje, accesos.
`;

export const OBJECTIONS = `# Objeciones comunes y respuesta recomendada (basadas en el manual)

Proceso para TODA objeción: escuchar sin interrumpir → confirmar que entendió → hacer una pregunta → identificar la objeción real → responder con información autorizada → volver a pedir la decisión ("Con eso resuelto, ¿avanzamos?").

- "Está muy caro" / "Vi otra más barata": no defender de inmediato. Preguntar: "¿Qué parte te gustaría evaluar: el producto, la inversión o el momento de compra?" o "¿Qué es lo que más te gusta de la otra opción?". Responder con lo que el cliente dijo en C/D (su salud, su negocio, su descanso). Concesiones sólo si duda mucho y paga esta semana.
- "Lo tengo que pensar" / "Me quiero esperar": entender qué falta. Conectar con el costo de esperar según su problema ("¿Para qué esperar seis meses más durmiendo mal?"). Proponer fecha y hora concreta.
- "Lo tengo que consultar con mi pareja / socio": debió detectarse en la B. Agendar llamada con fecha, hora y ambos presentes. El vendedor propone la fecha.
- "Mándame la información / cotización": no es cierre. Mandarla y acordar fecha y hora de seguimiento antes de colgar.
- "¿Me haces descuento?": no ofrecer descuento al dar precio. Entender la objeción real primero. Las únicas concesiones autorizadas son las del manual, condicionadas a que el pago quede esta semana.
- "¿Y si no me gusta?": garantía de satisfacción de 30 días con reembolso del 100%.
- "¿Es inflable? ¿Se poncha?": Horizon y Barrel son de drop-stitch grado militar; si el cliente quiere rígida, MF ONE.
- "Tarda mucho en llegar" (MF ONE): revisar stock real; si quiere ya, Horizon llega en 2–3 días hábiles.
- Negocio que se quiere esperar: el producto ayuda a impulsar ventas y da otro modelo de negocio; se puede mencionar arrendamiento (confirmar términos).
`;

export const PROFILING = `# Preguntas de perfilamiento (resumen de la tarjeta de llamada)

Mínimo 5 a 7 preguntas antes de explicar producto.

Apertura (B): "Antes de explicarte los productos, me gustaría entender exactamente qué estás buscando y recomendarte la mejor opción. ¿Te parece?" · "¿Qué fue lo que te llamó la atención de nuestros productos?" · "Además de ti, ¿hay alguien más involucrado en la decisión?" (primeros 3 minutos)

Situación actual (C): "¿Lo buscas para ti o para un negocio?" · "¿Ya has utilizado cold plunge anteriormente?" · "¿En dónde te gustaría instalarlo?" · "¿Actualmente tienes alguna solución similar?" · "¿También quieres que la tina caliente el agua?"

Persona: "¿Entrenas? ¿Qué haces?" · "¿Cómo estás durmiendo?" · "¿Hay algo de tu salud o de tu energía que quieras mejorar?"
Negocio: "¿Qué tipo de negocio es y a quién atiende?" · "¿Qué te gustaría ofrecerles a tus clientes que hoy no tienes?" · "¿Cómo te imaginas que esto le ayude al negocio?"

Problema (D): "¿Qué te hizo buscarlo justo ahora?" · "¿Qué has intentado hasta ahora y cuánto llevas gastado?" · "¿Cómo te afecta eso en tu día / a tu negocio?" · "¿Qué cambiaría para ti si lo resuelves?"

Resultado deseado (E): "Con todo lo que me contaste, ¿cuál es la característica más importante que tiene que tener el equipo para que te funcione perfecto?" · "¿Para cuándo te gustaría tenerlo instalado?"

Calificación (F): espacio disponible, ubicación, instalación eléctrica y drenaje, fecha requerida, modelo por el que llegó, decisores, nivel de interés.

Cierre de la C: "¿Viste algún modelo en específico, la MF ONE o la Horizon? ¿Cuál te gustó?"
`;

export const SEED_DOCUMENTS: SeedDocument[] = [
  {
    title: "Manual de llamada · Pasos A–L",
    category: "manual",
    content: SALES_MANUAL,
    priority: 100,
    use_in_customer: false,
    use_in_evaluation: true,
  },
  {
    title: "Políticas comerciales",
    category: "policies",
    content: POLICIES,
    priority: 90,
    use_in_customer: false,
    use_in_evaluation: true,
  },
  {
    title: "Preguntas de perfilamiento",
    category: "profiling_questions",
    content: PROFILING,
    priority: 85,
    use_in_customer: false,
    use_in_evaluation: true,
  },
  {
    title: "Objeciones comunes",
    category: "objections",
    content: OBJECTIONS,
    priority: 80,
    use_in_customer: false,
    use_in_evaluation: true,
  },
  {
    title: "Instalación y logística",
    category: "installation",
    content: INSTALLATION,
    priority: 70,
    use_in_customer: false,
    use_in_evaluation: true,
  },
];
