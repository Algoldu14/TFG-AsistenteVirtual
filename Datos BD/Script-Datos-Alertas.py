import random
# Script para generar datos de alertas aleatorios
texto = ""
for x in range(0, 20):  # x: Alert id /Station id                    /Sensor type                      /Active
    texto += "("+ str(x) +", "+ str(random.randint(1, 4))+", "+str(random.randint(1, 6))+", "+str(random.randint(0, 1))+"), " 
print(texto)

lista= ["Valor superado por la cota superior", "Valor inferior a la cota inferior","Perdida de datos","Sensor desconectado"]
texto2 = ""
for x in range(0, 20):  
    texto2 += "("+ str(x) +", "+ "\""+random.choice(lista)+"\""+"), "

print(texto2)