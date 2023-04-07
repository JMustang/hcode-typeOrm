import { Somar } from '../utils/somar';

test('testing the user service', () => {
  const result = Somar(3, 2);
  expect(result).toEqual(5);
});
