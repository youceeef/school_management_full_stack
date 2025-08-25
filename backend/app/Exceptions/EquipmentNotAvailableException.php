<?php

namespace App\Exceptions;

use Exception;

class EquipmentNotAvailableException extends Exception
{
    protected $errors;

    public function __construct(string $message = "Un ou plusieurs équipements ne sont pas disponibles.", array $errors = [])
    {
        parent::__construct($message);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
