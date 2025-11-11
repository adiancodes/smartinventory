@ECHO OFF
@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------

@IF "%DEBUG%"=="" @ECHO OFF
@SETLOCAL

SET SCRIPT_DIR=%~dp0
IF "%SCRIPT_DIR%"=="" SET SCRIPT_DIR=.
IF "%SCRIPT_DIR:~-1%"=="\" SET SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

SET MAVEN_PROJECTBASEDIR=%SCRIPT_DIR%
SET WRAPPER_JAR=%SCRIPT_DIR%\.mvn\wrapper\maven-wrapper.jar
SET WRAPPER_PROPERTIES=%SCRIPT_DIR%\.mvn\wrapper\maven-wrapper.properties
SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

IF NOT EXIST "%WRAPPER_JAR%" (
  IF NOT EXIST "%WRAPPER_PROPERTIES%" (
    ECHO Error: %WRAPPER_PROPERTIES% not found.
    EXIT /B 1
  )
  FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%WRAPPER_PROPERTIES%") DO (
    IF /I "%%~A"=="wrapperUrl" SET WRAPPER_URL=%%~B
  )
  IF NOT DEFINED WRAPPER_URL SET WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
  ECHO Downloading Maven Wrapper from %WRAPPER_URL%
  powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile \"%WRAPPER_JAR%\"" || (
    ECHO Failed to download Maven Wrapper jar.
    EXIT /B 1
  )
)

SET JAVA_EXE=
IF NOT "%JAVA_HOME%"=="" SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
IF EXIST "%JAVA_EXE%" GOTO javaFound
SET JAVA_EXE=java.exe

:javaFound
IF NOT "%DEBUG%"=="" (
  ECHO Running: "%JAVA_EXE%" -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -classpath "%WRAPPER_JAR%" %WRAPPER_LAUNCHER% %*
)
"%JAVA_EXE%" -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -classpath "%WRAPPER_JAR%" %WRAPPER_LAUNCHER% %*
SET EXIT_CODE=%ERRORLEVEL%

ENDLOCAL & EXIT /B %EXIT_CODE%
