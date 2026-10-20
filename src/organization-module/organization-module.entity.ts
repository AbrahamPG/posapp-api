import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";



@Entity('organization_modules')
@Check(
  'CHK_organization_modules_module_key',
  `"moduleKey" IN ('catalog', 'pos')`,
)
@Index( 'UQ_organization_modules_tenant_module', ['tenantId', 'moduleKey'], { unique: true })
export class OrganizationModule {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: 'text'})
    tenantId: string

    // Módulo contratado: catalog o pos
    @Column({ type: 'varchar', length: 30 })
    moduleKey: string;

    @Column({type: 'boolean', default: true})
    isEnabled: boolean

    @Column({type: 'timestamptz',
        default: () => "CURRENT_TIMESTAMP",
    })
    startsAt: Date

    @Column({type: 'timestamptz', nullable: true})
    expiresAt: Date | null

    // ID del administrador que activó el módulo
    @Column({type: 'text', nullable: true})
    activatedBy: string | null

    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date

    @UpdateDateColumn({type: 'timestamptz'})
    updatedAt: Date


}