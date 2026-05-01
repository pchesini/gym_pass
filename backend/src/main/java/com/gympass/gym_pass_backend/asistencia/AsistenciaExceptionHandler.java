package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaAccesoBloqueadoResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = AsistenciaController.class)
public class AsistenciaExceptionHandler {

    @ExceptionHandler(AsistenciaAccesoBloqueadoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public AsistenciaAccesoBloqueadoResponse handleAccesoBloqueado(
            AsistenciaAccesoBloqueadoException exception
    ) {
        return exception.toResponse();
    }
}
