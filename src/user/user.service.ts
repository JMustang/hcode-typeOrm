import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserEntity } from './entities/user.entity';
import { UpdatePutUserEntity } from './entities/update-put-user.entity';
import { UpdatePatchUserEntity } from './entities/update-patch-user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  // Method POST
  async create(data: CreateUserEntity) {
    if (
      await this.usersRepository.exist({
        where: {
          email: data.email,
        },
      })
    ) {
      throw new BadRequestException(`This email, already exists`);
    }
    const salt = await bcrypt.genSalt();
    data.password = await bcrypt.hash(data.password, salt);

    const user = this.usersRepository.create(data);

    return this.usersRepository.save(user);
  }

  // Method GET
  async readAll() {
    return this.usersRepository.find();
  }

  async readOne(id: number) {
    await this.exist(id);
    return this.usersRepository.findOneBy({
      id,
    });
  }

  async update(
    id: number,
    { email, name, password, birthAt, role }: UpdatePutUserEntity,
  ) {
    await this.exist(id);

    const salt = await bcrypt.genSalt();
    password = await bcrypt.hash(password, salt);

    await this.usersRepository.update(id, {
      email,
      name,
      password,
      birthAt: birthAt ? new Date(birthAt) : null,
      role,
    });
    return this.readOne(id);
  }

  async partialUpdate(
    id: number,
    { email, name, password, birthAt, role }: UpdatePatchUserEntity,
  ) {
    await this.exist(id);

    const data: any = {};
    if (birthAt) {
      data.birthAt = new Date(birthAt);
    }

    if (email) {
      data.email = email;
    }

    if (name) {
      data.name = name;
    }

    if (password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(password, salt);
    }

    if (role) {
      data.role = role;
    }

    await this.usersRepository.update(id, data);
    return this.readOne(id);
  }

  async delete(id: number) {
    await this.exist(id);

    return this.usersRepository.delete(id);
  }

  async exist(id: number) {
    if (
      !(await this.usersRepository.exist({
        where: {
          id,
        },
      }))
    ) {
      throw new NotFoundException(`User ${id}, does not exist!`);
    }
  }
}
