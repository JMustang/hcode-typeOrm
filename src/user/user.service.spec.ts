import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { userRepositoryMock } from '../testing/user-repository.mock';
import { CreateUserEntity } from './entities/user.entity';
import { Role } from '../enums/role.enum';
import { UserEntity } from './entity/user.entity';

const UserEntityList: UserEntity[] = [{}];

describe('UserService', () => {
  let userService: UserService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, userRepositoryMock],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  test('validate the definition', () => {
    expect(userService).toBeDefined();
  });

  describe('Create', () => {
    test('method create', async () => {
      const data: CreateUserEntity = {
        birthAt: '2000-01-01',
        email: 'user@email.com',
        name: 'user',
        password: '123455',
        role: Role.User,
      };
      const result = await userService.create(data);
    });
  });
  describe('read', () => {});
  describe('update', () => {});
  describe('delete', () => {});
});
