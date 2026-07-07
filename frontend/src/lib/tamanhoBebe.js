// Comparações de tamanho puramente ilustrativas (apresentação), não vêm da API.
const TABELA = [
  [4, 'uma semente de papoula'],
  [6, 'uma lentilha'],
  [8, 'uma framboesa'],
  [10, 'um figo'],
  [12, 'uma ameixa'],
  [14, 'um limão'],
  [16, 'um abacate'],
  [18, 'um pimentão'],
  [20, 'uma banana'],
  [22, 'uma papaia'],
  [24, 'uma espiga de milho'],
  [26, 'uma alface'],
  [28, 'uma berinjela'],
  [30, 'um repolho'],
  [32, 'um coco'],
  [34, 'um melão pequeno'],
  [36, 'uma alface romana'],
  [38, 'um abacaxi'],
  [40, 'uma melancia pequena'],
];

export function tamanhoNaSemana(semanas) {
  let atual = TABELA[0][1];
  for (const [semana, fruta] of TABELA) {
    if (semanas >= semana) atual = fruta;
  }
  return atual;
}
