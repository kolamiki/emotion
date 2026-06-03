import { readFileSync } from 'fs';
const scenariosEnginePath = 'c:/Moje_Programy/e_motion/project/src/store/scenarioEngine.ts';
const usersPath = 'c:/Moje_Programy/e_motion/project/src/mockData/users.json';
const users = JSON.parse(readFileSync(usersPath, 'utf8'));

console.log(users.allUsers.find(u => u.id === 'u_marinette'));
