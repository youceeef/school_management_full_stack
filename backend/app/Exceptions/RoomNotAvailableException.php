<?php

namespace App\Exceptions;

use Exception;

class RoomNotAvailableException extends Exception
{
    protected $errors;

    public function __construct(string $message = "La salle n'est pas disponible pour la période demandée.", array $errors = [])
    {
        parent::__construct($message);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
