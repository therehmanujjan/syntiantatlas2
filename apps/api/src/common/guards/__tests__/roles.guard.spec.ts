import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user?: any, roles?: string[]): ExecutionContext => {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;

    if (roles !== undefined) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
    } else {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    }

    return context;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    const context = mockExecutionContext({ roleId: 'investor' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when roles array is empty', () => {
    const context = mockExecutionContext({ roleId: 'investor' }, []);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const context = mockExecutionContext({ roleId: 'admin' }, ['admin', 'operations_manager']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    const context = mockExecutionContext({ roleId: 'investor' }, ['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when no user on request', () => {
    const context = mockExecutionContext(undefined, ['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access for null user', () => {
    const context = mockExecutionContext(null, ['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });
});
