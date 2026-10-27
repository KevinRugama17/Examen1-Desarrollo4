<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    
   $categoria = Categoria::factory()->create();
    $datos = [
        'codigo'            => 'EQ-9999',
        'nombre'            => 'Equipo de prueba',
        'categoria_id'      => $categoria->id,
        'estado'            => 'disponible',
        'fecha_adquisicion' => now()->toDateString(),
        'costo_interno'     => 150000,
    ];
    $response = $this->postJson('/api/equipos', $datos);
    $response
        ->assertCreated()
        ->assertHeader('Location')
        ->assertJsonPath('data.codigo', 'EQ-9999');
    $this->assertDatabaseHas('equipos', [
        'codigo' => 'EQ-9999',
        'nombre' => 'Equipo de prueba',
    ]);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {

$response = $this->postJson('/api/equipos', [
        'codigo'            => 'invalido',                           // Formato incorrecto
        'nombre'            => 'ab',                                 // Menos de 3 caracteres
        'categoria_id'      => 999999,                               // No existe
        'estado'            => 'prestado',                           // Solo disponible o mantenimiento
        'fecha_adquisicion' => now()->addDay()->toDateString(),      // Fecha futura
        'costo_interno'     => -10,                                  // Menor a 0
    ]);
    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'estado',
            'fecha_adquisicion',
            'costo_interno',
        ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {

   $equipo = Equipo::factory()->prestado()->create();
    $response = $this->deleteJson("/api/equipos/{$equipo->id}");
    $response
        ->assertStatus(409)
        ->assertJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo'  => 'REGLA_NEGOCIO',
        ]);
    $this->assertDatabaseHas('equipos', [
        'id' => $equipo->id,
    ]);
});