import {test,expect} from './support/test';
test('grader requested viewport reaches browser',async({page})=>{const [width,height]=process.env.E2E_VIEWPORT!.split('x').map(Number);expect(page.viewportSize()).toEqual({width,height});});
