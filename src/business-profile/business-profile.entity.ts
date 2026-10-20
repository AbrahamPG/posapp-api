import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('business_profile')
export class BusinessProfile {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: 'text', unique: true})
    tenantId: string

    @Column({type: 'varchar', length: 50, nullable: true})
    businessType: string | null
    
    @Column({type: 'text', nullable: true})
    description: string | null

    @Column({type: 'text', nullable: true})
    address: string | null

    @Column({type: 'varchar', length: 20, nullable: true})
    phone: string | null

    // Imagen de fondo personalizable de la ficha pública. Proximamente
    @Column({type: 'text', nullable: true})
    coverImageUrl: string | null

    // Máximo 5 fotos gratis o 15 con el módulo de catálogo.
    // El límite se validará en el servicio.
    @Column({type: 'jsonb', default: ()=> "'[]'::jsonb"})
    photos: string[] | null

    // Ejemplo: { instagram: "...", facebook: "...", tiktok: "..." }
    @Column({type: 'jsonb', nullable: true})
    socialLinks: Record<string, string> | null

    @Column({type: 'jsonb', nullable: true})
    openingHours: Record<string, { open: string, close: string }> | null

    @Column({type: 'boolean', default: false})
    isPublished: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date


}